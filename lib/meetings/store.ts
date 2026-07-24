import "server-only";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { meetings } from "@/lib/db/schema";
import { logActivity } from "@/lib/activity/store";
import type { Meeting, MeetingKind } from "./types";

export async function listMeetings(userId: string): Promise<Meeting[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(meetings).where(eq(meetings.userId, userId)).orderBy(asc(meetings.whenAt));
  return rows as unknown as Meeting[];
}

export async function createMeeting(
  userId: string,
  input: { title: string; kind?: MeetingKind; whenAt: Date; whenLabel: string; leadId?: string | null; agentId?: string | null }
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(meetings)
    .values({
      userId,
      title: input.title,
      kind: input.kind ?? "call",
      whenAt: input.whenAt,
      whenLabel: input.whenLabel,
      leadId: input.leadId ?? null,
      agentId: input.agentId ?? null,
    })
    .returning({ id: meetings.id });

  await logActivity(userId, {
    type: "meeting_booked",
    leadId: input.leadId ?? null,
    agentId: input.agentId ?? null,
    text: `Booked "${input.title}" for ${input.whenLabel}`,
  });

  return row.id;
}
