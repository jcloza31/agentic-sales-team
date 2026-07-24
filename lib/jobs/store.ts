import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

export type JobRow = typeof jobs.$inferSelect;

export async function enqueueJob(userId: string, kind: string, params: Record<string, unknown>, agentId?: string | null): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(jobs)
    .values({ userId, agentId: agentId ?? null, kind, params, status: "queued" })
    .returning({ id: jobs.id });
  return row.id;
}

// Atomically claims up to `limit` queued jobs of the given kinds for this
// user — the status='queued' guard on the update means two runners can
// never claim the same row.
export async function claimQueuedJobs(userId: string, kinds: string[], limit: number): Promise<JobRow[]> {
  const db = getDb();
  if (!db) return [];

  const queued = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.userId, userId), eq(jobs.status, "queued"), inArray(jobs.kind, kinds)))
    .limit(limit);

  if (queued.length === 0) return [];

  return db
    .update(jobs)
    .set({ status: "running", startedAt: new Date() })
    .where(and(inArray(jobs.id, queued.map((r) => r.id)), eq(jobs.status, "queued")))
    .returning();
}

export async function completeJob(id: string, result?: Record<string, unknown>) {
  const db = getDb();
  if (!db) return;
  await db.update(jobs).set({ status: "done", result: result ?? null, finishedAt: new Date() }).where(eq(jobs.id, id));
}

export async function failJob(id: string, error: string) {
  const db = getDb();
  if (!db) return;
  await db.update(jobs).set({ status: "failed", error, finishedAt: new Date() }).where(eq(jobs.id, id));
}
