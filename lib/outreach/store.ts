import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { outreachDrafts } from "@/lib/db/schema";

export interface OutreachDraft {
  id: string;
  userId: string;
  agentId: string | null;
  leadId: string;
  subject: string | null;
  body: string;
  rationale: string | null;
  status: "draft" | "sent";
  dismissed: boolean;
  createdAt: Date;
  sentAt: Date | null;
}

export async function saveOutreachDraft(
  userId: string,
  input: { agentId: string | null; leadId: string; subject: string; body: string; rationale: string }
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(outreachDrafts)
    .values({
      userId,
      agentId: input.agentId,
      leadId: input.leadId,
      subject: input.subject,
      body: input.body,
      rationale: input.rationale,
      status: "draft",
    })
    .returning({ id: outreachDrafts.id });
  return row.id;
}

export async function getLatestOutreachDraft(userId: string, leadId: string): Promise<OutreachDraft | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(outreachDrafts)
    .where(and(eq(outreachDrafts.userId, userId), eq(outreachDrafts.leadId, leadId)))
    .orderBy(desc(outreachDrafts.createdAt))
    .limit(1);
  return (rows[0] as unknown as OutreachDraft) ?? null;
}

export async function listOutreachDraftsForUser(userId: string): Promise<OutreachDraft[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(outreachDrafts)
    .where(and(eq(outreachDrafts.userId, userId), eq(outreachDrafts.dismissed, false)))
    .orderBy(desc(outreachDrafts.createdAt));
  return rows as unknown as OutreachDraft[];
}
