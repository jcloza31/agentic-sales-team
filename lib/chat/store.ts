import "server-only";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";

export interface ChatMessage {
  id: number;
  userId: string;
  agentId: string | null;
  who: "ai" | "me";
  text: string;
  createdAt: Date;
}

export async function listMessages(userId: string): Promise<ChatMessage[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(asc(messages.id));
  return rows as unknown as ChatMessage[];
}

export async function addMessage(userId: string, input: { agentId?: string | null; who: "ai" | "me"; text: string }): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(messages).values({ userId, agentId: input.agentId ?? null, who: input.who, text: input.text });
}
