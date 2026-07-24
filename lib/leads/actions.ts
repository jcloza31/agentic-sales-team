"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { addLead, importLeadsCsv, updateLeadStage, assignLeadAgent, acceptLead, rejectLead } from "./store";
import { enqueueJob } from "@/lib/jobs/store";
import { getLatestOutreachDraft } from "@/lib/outreach/store";
import type { LeadStatus } from "./types";

export async function addLeadAction(input: { name: string; company?: string; email?: string; platform?: string; website?: string; agentId?: string | null }) {
  const { userId } = await auth();
  if (!userId) return null;
  const id = await addLead(userId, input);
  revalidatePath("/deals");
  return id;
}

export async function importLeadsCsvAction(csvText: string) {
  const { userId } = await auth();
  if (!userId) return 0;
  const count = await importLeadsCsv(userId, csvText);
  revalidatePath("/deals");
  return count;
}

export async function updateLeadStageAction(id: string, status: LeadStatus) {
  const { userId } = await auth();
  if (!userId) return;
  await updateLeadStage(userId, id, status);
  revalidatePath("/deals");
}

export async function assignLeadAgentAction(id: string, agentId: string | null) {
  const { userId } = await auth();
  if (!userId) return;
  await assignLeadAgent(userId, id, agentId);
  revalidatePath("/deals");
}

export async function acceptLeadAction(id: string) {
  const { userId } = await auth();
  if (!userId) return;
  await acceptLead(userId, id);
  revalidatePath("/deals");
}

export async function rejectLeadAction(id: string) {
  const { userId } = await auth();
  if (!userId) return;
  await rejectLead(userId, id);
  revalidatePath("/deals");
}

export async function enqueueResearchAction(leadId: string, agentId?: string | null) {
  const { userId } = await auth();
  if (!userId) return null;
  const id = await enqueueJob(userId, "research", { leadId }, agentId ?? null);
  revalidatePath("/deals");
  return id;
}

export async function enqueueOutreachAction(leadId: string, agentId?: string | null) {
  const { userId } = await auth();
  if (!userId) return null;
  const id = await enqueueJob(userId, "outreach", { leadId }, agentId ?? null);
  revalidatePath("/deals");
  return id;
}

export async function enqueueProposalAction(leadId: string, agentId?: string | null) {
  const { userId } = await auth();
  if (!userId) return null;
  const id = await enqueueJob(userId, "proposal", { leadId }, agentId ?? null);
  revalidatePath("/deals");
  return id;
}

export async function enqueueFollowupAction(leadId: string, agentId?: string | null) {
  const { userId } = await auth();
  if (!userId) return null;
  const prior = await getLatestOutreachDraft(userId, leadId);
  if (!prior) return null; // nothing to build on yet
  const id = await enqueueJob(userId, "follow-up", { leadId }, agentId ?? null);
  revalidatePath("/deals");
  return id;
}
