import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { currentUser } from "@/lib/auth/currentUser";
import { claimQueuedJobs, completeJob, failJob, type JobRow } from "@/lib/jobs/store";
import { getProfile, profileSummary, creatorDisplayName } from "@/lib/profile/store";
import { getLead, updateLeadStage, saveLeadResearch } from "@/lib/leads/store";
import { getAgent } from "@/lib/agents/store";
import { saveOutreachDraft, getLatestOutreachDraft } from "@/lib/outreach/store";
import { saveProposal } from "@/lib/proposals/store";
import { draftResearch } from "@/lib/ai/research";
import { draftOutreach } from "@/lib/ai/outreach";
import { draftProposal } from "@/lib/ai/proposal";
import { draftFollowup } from "@/lib/ai/followup";
import { logActivity } from "@/lib/activity/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const HANDLED_KINDS = ["research", "outreach", "proposal", "follow-up"];
const BATCH_SIZE = 5;
const CONCURRENCY = 4;

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { userId } = user;
  if (!isDbConfigured()) return NextResponse.json({ processed: 0 });

  const claimed = await claimQueuedJobs(userId, HANDLED_KINDS, BATCH_SIZE);
  if (claimed.length === 0) return NextResponse.json({ processed: 0 });

  const profile = await getProfile(userId);
  const creatorContext = profileSummary(profile);
  const creatorName = creatorDisplayName(user.name, user.email);

  let processed = 0;
  for (let i = 0; i < claimed.length; i += CONCURRENCY) {
    const batch = claimed.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        try {
          if (job.kind === "research") await runResearch(userId, job, creatorContext);
          else if (job.kind === "outreach") await runOutreach(userId, job, creatorContext, creatorName);
          else if (job.kind === "proposal") await runProposal(userId, job, creatorContext, creatorName);
          else if (job.kind === "follow-up") await runFollowup(userId, job, creatorContext, creatorName);
          await completeJob(job.id);
          processed++;
        } catch (err) {
          await failJob(job.id, err instanceof Error ? err.message : String(err));
        }
      })
    );
  }

  return NextResponse.json({ processed });
}

async function agentNameFor(userId: string, job: JobRow, fallback: string): Promise<string> {
  const agent = job.agentId ? await getAgent(userId, job.agentId) : null;
  return agent?.name ?? fallback;
}

async function runResearch(userId: string, job: JobRow, creatorContext: string) {
  const params = job.params as { leadId?: string };
  if (!params.leadId) return;
  const lead = await getLead(userId, params.leadId);
  if (!lead) return;

  const agentName = await agentNameFor(userId, job, "Your Research agent");
  const result = await draftResearch(agentName, lead, creatorContext);
  await saveLeadResearch(userId, lead.id, result);
  await logActivity(userId, {
    type: "lead_qualified",
    leadId: lead.id,
    agentId: job.agentId,
    text: `${agentName} wrote a research brief for ${lead.name}`,
  });
}

async function runOutreach(userId: string, job: JobRow, creatorContext: string, creatorName: string) {
  const params = job.params as { leadId?: string };
  if (!params.leadId) return;
  const lead = await getLead(userId, params.leadId);
  if (!lead) return;

  const agentName = await agentNameFor(userId, job, "Your Outreach agent");
  const result = await draftOutreach(agentName, lead, creatorContext, creatorName);
  await saveOutreachDraft(userId, { agentId: job.agentId, leadId: lead.id, subject: result.subject, body: result.body, rationale: result.rationale });
  await updateLeadStage(userId, lead.id, result.stage);
  await logActivity(userId, {
    type: "email_drafted",
    leadId: lead.id,
    agentId: job.agentId,
    text: `${agentName} drafted a pitch for ${lead.name}`,
  });
}

async function runProposal(userId: string, job: JobRow, creatorContext: string, creatorName: string) {
  const params = job.params as { leadId?: string };
  if (!params.leadId) return;
  const lead = await getLead(userId, params.leadId);
  if (!lead) return;

  const agentName = await agentNameFor(userId, job, "Your Proposal agent");
  const result = await draftProposal(agentName, lead, creatorContext, creatorName);
  await saveProposal(userId, { agentId: job.agentId, leadId: lead.id, title: result.title, body: result.body, products: result.packages });
  await logActivity(userId, {
    type: "proposal_drafted",
    leadId: lead.id,
    agentId: job.agentId,
    text: `${agentName} drafted a proposal for ${lead.name}`,
  });
}

async function runFollowup(userId: string, job: JobRow, creatorContext: string, creatorName: string) {
  const params = job.params as { leadId?: string };
  if (!params.leadId) return;
  const lead = await getLead(userId, params.leadId);
  if (!lead) return;

  const prior = await getLatestOutreachDraft(userId, lead.id);
  if (!prior) return; // nothing to build on yet

  const agentName = await agentNameFor(userId, job, "Your Follow-up agent");
  const result = await draftFollowup(agentName, lead, prior.body, creatorContext, creatorName);
  await saveOutreachDraft(userId, { agentId: job.agentId, leadId: lead.id, subject: result.subject, body: result.body, rationale: result.rationale });
  await logActivity(userId, {
    type: "email_drafted",
    leadId: lead.id,
    agentId: job.agentId,
    text: `${agentName} followed up with ${lead.name}`,
  });
}
