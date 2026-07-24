import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { logActivity } from "@/lib/activity/store";
import { parseLeadsCsv } from "./csv";
import type { Lead, LeadStatus, LeadResearch } from "./types";

export async function listLeads(userId: string): Promise<Lead[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.review, "accepted")))
    .orderBy(desc(leads.createdAt));
  return rows as unknown as Lead[];
}

export async function listPendingLeads(userId: string): Promise<Lead[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.review, "pending")))
    .orderBy(desc(leads.createdAt));
  return rows as unknown as Lead[];
}

export async function addLead(
  userId: string,
  input: { name: string; company?: string; email?: string; platform?: string; website?: string; agentId?: string | null }
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(leads)
    .values({
      userId,
      name: input.name,
      company: input.company || null,
      email: input.email || null,
      platform: input.platform || null,
      website: input.website || null,
      agentId: input.agentId || null,
      status: "new",
      source: "manual",
      review: "accepted",
    })
    .returning({ id: leads.id });

  await logActivity(userId, {
    type: "lead_added",
    leadId: row.id,
    agentId: input.agentId ?? null,
    text: `Added ${input.name}${input.company ? ` (${input.company})` : ""}`,
  });

  return row.id;
}

export async function importLeadsCsv(userId: string, csvText: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const parsed = parseLeadsCsv(csvText);
  let count = 0;
  for (const row of parsed) {
    await db.insert(leads).values({
      userId,
      name: row.name,
      company: row.company,
      email: row.email,
      platform: row.platform,
      website: row.website,
      status: "new",
      source: "manual",
      review: "accepted",
    });
    count++;
  }

  if (count > 0) {
    await logActivity(userId, { type: "lead_added", text: `Imported ${count} brand${count === 1 ? "" : "s"} from a CSV file` });
  }

  return count;
}

export async function updateLeadStage(userId: string, id: string, status: LeadStatus) {
  const db = getDb();
  if (!db) return;
  await db.update(leads).set({ status, updatedAt: new Date() }).where(and(eq(leads.userId, userId), eq(leads.id, id)));
}

export async function assignLeadAgent(userId: string, id: string, agentId: string | null) {
  const db = getDb();
  if (!db) return;
  await db.update(leads).set({ agentId, updatedAt: new Date() }).where(and(eq(leads.userId, userId), eq(leads.id, id)));
}

export async function acceptLead(userId: string, id: string) {
  const db = getDb();
  if (!db) return;
  await db.update(leads).set({ review: "accepted", updatedAt: new Date() }).where(and(eq(leads.userId, userId), eq(leads.id, id)));
}

export async function rejectLead(userId: string, id: string) {
  const db = getDb();
  if (!db) return;
  await db.delete(leads).where(and(eq(leads.userId, userId), eq(leads.id, id)));
}

export async function getLead(userId: string, id: string): Promise<Lead | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(leads).where(and(eq(leads.userId, userId), eq(leads.id, id))).limit(1);
  return (rows[0] as unknown as Lead) ?? null;
}

export async function saveLeadResearch(userId: string, id: string, research: LeadResearch) {
  const db = getDb();
  if (!db) return;
  await db.update(leads).set({ research, updatedAt: new Date() }).where(and(eq(leads.userId, userId), eq(leads.id, id)));
}

export async function addDiscoveredLeads(
  userId: string,
  candidates: { name: string; company?: string; platform?: string; profileUrl?: string; website?: string }[]
): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  // Skip anything that's already in the pipeline (accepted or pending) so
  // repeated searches don't pile up the same brand over and over.
  const existing = await db.select({ name: leads.name }).from(leads).where(eq(leads.userId, userId));
  const existingNames = new Set(existing.map((r) => r.name.trim().toLowerCase()));

  let count = 0;
  for (const c of candidates) {
    const name = c.name || c.company;
    if (!name) continue;
    const key = name.trim().toLowerCase();
    if (existingNames.has(key)) continue;
    existingNames.add(key);
    await db.insert(leads).values({
      userId,
      name,
      company: c.company || null,
      platform: c.platform || null,
      profileUrl: c.profileUrl || null,
      website: c.website || null,
      status: "new",
      source: "scrape",
      review: "pending",
    });
    count++;
  }

  if (count > 0) {
    await logActivity(userId, { type: "lead_added", text: `Research found ${count} new brand${count === 1 ? "" : "s"} for your approval` });
  }

  return count;
}
