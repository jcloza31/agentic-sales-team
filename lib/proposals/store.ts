import "server-only";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { proposals } from "@/lib/db/schema";

export interface Proposal {
  id: string;
  userId: string;
  agentId: string | null;
  leadId: string;
  title: string;
  body: string;
  products: string[];
  status: "draft" | "sent";
  createdAt: Date;
  sentAt: Date | null;
}

export async function saveProposal(
  userId: string,
  input: { agentId: string | null; leadId: string; title: string; body: string; products: string[] }
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(proposals)
    .values({
      userId,
      agentId: input.agentId,
      leadId: input.leadId,
      title: input.title,
      body: input.body,
      products: input.products,
      status: "draft",
    })
    .returning({ id: proposals.id });
  return row.id;
}

export async function listProposalsForUser(userId: string): Promise<Proposal[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(proposals).where(eq(proposals.userId, userId)).orderBy(desc(proposals.createdAt));
  return rows as unknown as Proposal[];
}
