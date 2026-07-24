import "server-only";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agents, agentConfig, agentStates } from "@/lib/db/schema";
import { AGENT_TYPES, type AgentType } from "@/lib/agentTypes";
import type { StatusKey } from "@/lib/data";

export interface MergedAgent {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  status: StatusKey;
  task: string;
  goal: string;
  capabilities: string[];
  type: "preset" | "custom";
}

function presetToMerged(a: AgentType): MergedAgent {
  return {
    id: a.id,
    name: a.name,
    initials: a.initials,
    role: a.role,
    color: a.color,
    status: "working",
    task: a.task,
    goal: "",
    capabilities: [a.capability],
    type: "preset",
  };
}

export async function listAgents(userId: string): Promise<MergedAgent[]> {
  const presets = AGENT_TYPES.map(presetToMerged);

  const db = getDb();
  if (!db) return presets;

  const [customRows, configRows, stateRows] = await Promise.all([
    db.select().from(agents).where(eq(agents.userId, userId)),
    db.select().from(agentConfig).where(eq(agentConfig.userId, userId)),
    db.select().from(agentStates).where(eq(agentStates.userId, userId)),
  ]);

  const custom: MergedAgent[] = customRows.map((r) => ({
    id: r.id,
    name: r.name,
    initials: r.initials,
    role: r.role,
    color: r.color,
    status: (r.status as StatusKey) ?? "working",
    task: r.task ?? "",
    goal: r.goal ?? "",
    capabilities: (r.capabilities as string[]) ?? [],
    type: "custom",
  }));

  const configByAgent = new Map(configRows.map((c) => [c.agentId, c]));
  const stateByAgent = new Map(stateRows.map((s) => [s.agentId, s]));

  return [...presets, ...custom]
    .filter((a) => !stateByAgent.get(a.id)?.removed)
    .map((a) => {
      const cfg = configByAgent.get(a.id);
      const state = stateByAgent.get(a.id);
      return {
        ...a,
        role: cfg?.role || a.role,
        goal: cfg?.goal || a.goal,
        status: state?.paused ? "offline" : a.status,
      };
    });
}

export async function getAgent(userId: string, id: string): Promise<MergedAgent | null> {
  const all = await listAgents(userId);
  return all.find((a) => a.id === id) ?? null;
}

export async function createAgent(
  userId: string,
  input: { name: string; role: string; color: string; capabilities: string[]; goal?: string }
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const id = "custom-" + Math.random().toString(36).slice(2, 8);
  const initials =
    input.name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AG";

  await db.insert(agents).values({
    userId,
    id,
    name: input.name,
    initials,
    role: input.role,
    color: input.color,
    status: "working",
    task: "Ready to help",
    goal: input.goal ?? "",
    capabilities: input.capabilities,
    type: "custom",
  });
  return id;
}

export async function updateAgent(
  userId: string,
  id: string,
  patch: { role?: string; goal?: string; name?: string; color?: string; capabilities?: string[] }
) {
  const db = getDb();
  if (!db) return;
  const isPreset = AGENT_TYPES.some((a) => a.id === id);

  if (isPreset) {
    await db
      .insert(agentConfig)
      .values({ userId, agentId: id, role: patch.role, goal: patch.goal })
      .onConflictDoUpdate({
        target: [agentConfig.userId, agentConfig.agentId],
        set: { role: patch.role, goal: patch.goal },
      });
    return;
  }

  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.role !== undefined) set.role = patch.role;
  if (patch.color !== undefined) set.color = patch.color;
  if (patch.goal !== undefined) set.goal = patch.goal;
  if (patch.capabilities !== undefined) set.capabilities = patch.capabilities;
  if (Object.keys(set).length === 0) return;
  await db.update(agents).set(set).where(and(eq(agents.userId, userId), eq(agents.id, id)));
}

export async function setAgentPaused(userId: string, id: string, paused: boolean) {
  const db = getDb();
  if (!db) return;
  await db
    .insert(agentStates)
    .values({ userId, agentId: id, paused, removed: false })
    .onConflictDoUpdate({ target: [agentStates.userId, agentStates.agentId], set: { paused } });
}

export async function removeAgent(userId: string, id: string) {
  const db = getDb();
  if (!db) return;
  await db
    .insert(agentStates)
    .values({ userId, agentId: id, removed: true, paused: false })
    .onConflictDoUpdate({ target: [agentStates.userId, agentStates.agentId], set: { removed: true } });
}
