import "server-only";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activity } from "@/lib/db/schema";

export async function logActivity(userId: string, input: { agentId?: string | null; type: string; leadId?: string | null; text: string }) {
  const db = getDb();
  if (!db) return;
  await db.insert(activity).values({
    userId,
    agentId: input.agentId ?? null,
    type: input.type,
    leadId: input.leadId ?? null,
    text: input.text,
  });
}

export async function listActivity(userId: string, limit = 50) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(activity).where(eq(activity.userId, userId)).orderBy(desc(activity.createdAt)).limit(limit);
}
