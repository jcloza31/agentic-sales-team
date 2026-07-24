import "server-only";
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jobs, activity } from "@/lib/db/schema";

export interface WorkspaceStats {
  activeAgentIds: string[];
  tasksRunning: number;
  leadsWorked: number;
  perAgent: { agentId: string; leadsWorked: number }[];
}

export interface ActivityRow {
  id: string;
  agentId: string | null;
  type: string;
  leadId: string | null;
  text: string;
  dismissed: boolean;
  createdAt: Date;
}

// Cheap, frequent-poll-friendly: just which agents have a job actually
// queued or running right now. Drives the dashboard's live "working" pulse.
export async function getActiveJobStatus(userId: string): Promise<{ activeAgentIds: string[]; tasksRunning: number }> {
  const db = getDb();
  if (!db) return { activeAgentIds: [], tasksRunning: 0 };
  const rows = await db
    .select({ agentId: jobs.agentId })
    .from(jobs)
    .where(and(eq(jobs.userId, userId), inArray(jobs.status, ["queued", "running"])));
  const activeAgentIds = Array.from(new Set(rows.map((r) => r.agentId).filter((a): a is string => Boolean(a))));
  return { activeAgentIds, tasksRunning: rows.length };
}

export async function getWorkspaceStats(userId: string): Promise<WorkspaceStats> {
  const db = getDb();
  if (!db) return { activeAgentIds: [], tasksRunning: 0, leadsWorked: 0, perAgent: [] };

  const [{ activeAgentIds, tasksRunning }, activityRows] = await Promise.all([
    getActiveJobStatus(userId),
    db.select().from(activity).where(eq(activity.userId, userId)),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const leadsThisMonth = new Set<string>();
  const perAgentMap = new Map<string, Set<string>>();

  for (const a of activityRows) {
    if (!a.leadId) continue;
    if (new Date(a.createdAt) >= monthStart) leadsThisMonth.add(a.leadId);
    if (a.agentId) {
      if (!perAgentMap.has(a.agentId)) perAgentMap.set(a.agentId, new Set());
      perAgentMap.get(a.agentId)!.add(a.leadId);
    }
  }

  const perAgent = Array.from(perAgentMap.entries()).map(([agentId, set]) => ({ agentId, leadsWorked: set.size }));

  return { activeAgentIds, tasksRunning, leadsWorked: leadsThisMonth.size, perAgent };
}

// Per-day activity counts for the last N days — feeds the Analytics chart.
export async function getDailyActivityCounts(userId: string, days = 14): Promise<{ date: string; label: string; count: number }[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select({ createdAt: activity.createdAt }).from(activity).where(eq(activity.userId, userId));

  const now = new Date();
  const order: string[] = [];
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    order.push(key);
    buckets.set(key, 0);
  }
  for (const r of rows) {
    const d = new Date(r.createdAt);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return order.map((key) => {
    const d = new Date(key);
    return { date: key, label: d.toLocaleDateString(undefined, { weekday: "short" }), count: buckets.get(key) ?? 0 };
  });
}
