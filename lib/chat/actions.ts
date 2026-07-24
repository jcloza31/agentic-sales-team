"use server";
import { revalidatePath } from "next/cache";
import { addMessage } from "./store";
import { currentUser } from "@/lib/auth/currentUser";
import { listAgents } from "@/lib/agents/store";
import type { MergedAgent } from "@/lib/agents/store";
import { listLeads, saveLeadResearch, updateLeadStage, addDiscoveredLeads } from "@/lib/leads/store";
import { getProfile, profileSummary, creatorDisplayName } from "@/lib/profile/store";
import { classifyChatIntent } from "@/lib/ai/chatIntent";
import { draftResearch } from "@/lib/ai/research";
import { draftOutreach } from "@/lib/ai/outreach";
import { draftProposal } from "@/lib/ai/proposal";
import { draftFollowup } from "@/lib/ai/followup";
import { parseMeetingRequest } from "@/lib/ai/meetingTime";
import { saveOutreachDraft, getLatestOutreachDraft } from "@/lib/outreach/store";
import { saveProposal } from "@/lib/proposals/store";
import { createMeeting } from "@/lib/meetings/store";
import { isFirecrawlConfigured, firecrawlSearch } from "@/lib/discovery/firecrawl";
import { extractBrandCandidates, fallbackBrandCandidates } from "@/lib/ai/discovery";

function parseMention(text: string): { mention: string | null; rest: string } {
  const m = text.match(/^@(\w+(?:\s\w+)?)\b\s*/);
  if (!m) return { mention: null, rest: text };
  return { mention: m[1].trim(), rest: text.slice(m[0].length).trim() };
}

function findAgentByMention(agents: MergedAgent[], mention: string): MergedAgent | null {
  const q = mention.toLowerCase();
  return (
    agents.find((a) => a.name.toLowerCase() === q || a.role.toLowerCase() === q) ??
    agents.find((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || q.includes(a.role.toLowerCase())) ??
    null
  );
}

function agentForCapability(agents: MergedAgent[], capability: string): MergedAgent | null {
  return agents.find((a) => a.capabilities.includes(capability)) ?? null;
}

function findLeadByName<T extends { id: string; name: string; company: string | null }>(leads: T[], query: string): T | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    leads.find((l) => {
      const name = l.name.toLowerCase();
      const company = l.company?.toLowerCase() ?? "";
      return name.includes(q) || (company && company.includes(q)) || q.includes(name) || (company && q.includes(company));
    }) ?? null
  );
}

export async function sendChatMessageAction(rawText: string) {
  const user = await currentUser();
  if (!user) return;
  const userId = user.userId;
  const text = rawText.trim();
  if (!text) return;

  await addMessage(userId, { who: "me", text });

  const { mention, rest } = parseMention(text);
  const agents = await listAgents(userId);
  const mentionedAgent = mention ? findAgentByMention(agents, mention) : null;
  const requestText = mention ? rest || text : text;

  const intent = await classifyChatIntent(mentionedAgent?.name ?? "the team", requestText);

  let actingAgent = mentionedAgent;
  if (intent.capability !== "chat" && (!actingAgent || !actingAgent.capabilities.includes(intent.capability))) {
    const capable = agentForCapability(agents, intent.capability);
    if (capable) actingAgent = capable;
  }
  if (!actingAgent) actingAgent = mentionedAgent ?? agents[0] ?? null;

  const profile = await getProfile(userId);
  const creatorContext = profileSummary(profile);
  const creatorName = creatorDisplayName(user.name, user.email);
  const agentName = actingAgent?.name ?? "Your teammate";
  const agentId = actingAgent?.id ?? null;

  let reply = intent.reply || "Got it!";

  try {
    if (intent.capability === "scrape") {
      const niche = intent.query || profile.niche || "content creator sponsorships";
      let candidates;
      if (isFirecrawlConfigured()) {
        try {
          const results = await firecrawlSearch(`brands that sponsor ${niche} content creators influencer partnerships`, 8);
          candidates = await extractBrandCandidates(niche, results);
          if (candidates.length === 0) candidates = fallbackBrandCandidates();
        } catch (err) {
          console.error("[chat/actions] discovery failed:", err);
          candidates = fallbackBrandCandidates();
        }
      } else {
        candidates = fallbackBrandCandidates();
      }
      const count = await addDiscoveredLeads(userId, candidates);
      reply =
        count > 0
          ? `Found ${count} ${niche} brand${count === 1 ? "" : "s"} — check Pending review on your Deals page to approve them.`
          : `I looked, but didn't turn up anything solid for "${niche}" — try a different niche or check back later.`;
    } else if (intent.capability === "research") {
      const leads = await listLeads(userId);
      const lead = findLeadByName(leads, intent.query);
      if (!lead) {
        reply = `I couldn't find a brand called "${intent.query}" in your pipeline — add it first, then I can write a brief.`;
      } else {
        const result = await draftResearch(agentName, lead, creatorContext);
        await saveLeadResearch(userId, lead.id, result);
        reply = `Wrote a brief for ${lead.name}: ${result.angle}`;
      }
    } else if (intent.capability === "outreach") {
      const leads = await listLeads(userId);
      const lead = findLeadByName(leads, intent.query);
      if (!lead) {
        reply = `I couldn't find a brand called "${intent.query}" in your pipeline — add it first, then I can pitch them.`;
      } else {
        const result = await draftOutreach(agentName, lead, creatorContext, creatorName);
        await saveOutreachDraft(userId, { agentId, leadId: lead.id, subject: result.subject, body: result.body, rationale: result.rationale });
        await updateLeadStage(userId, lead.id, result.stage);
        reply = `Drafted a pitch for ${lead.name} — check the Deals page to read it.`;
      }
    } else if (intent.capability === "proposal") {
      const leads = await listLeads(userId);
      const lead = findLeadByName(leads, intent.query);
      if (!lead) {
        reply = `I couldn't find a brand called "${intent.query}" in your pipeline — add it first, then I can price a proposal.`;
      } else {
        const result = await draftProposal(agentName, lead, creatorContext, creatorName);
        await saveProposal(userId, { agentId, leadId: lead.id, title: result.title, body: result.body, products: result.packages });
        reply = `Drafted a proposal for ${lead.name} — check the Deals page to read it.`;
      }
    } else if (intent.capability === "follow-up") {
      const leads = await listLeads(userId);
      const lead = findLeadByName(leads, intent.query);
      if (!lead) {
        reply = `I couldn't find a brand called "${intent.query}" in your pipeline.`;
      } else {
        const prior = await getLatestOutreachDraft(userId, lead.id);
        if (!prior) {
          reply = `I don't have a prior pitch to build on for ${lead.name} yet — draft one first.`;
        } else {
          const result = await draftFollowup(agentName, lead, prior.body, creatorContext, creatorName);
          await saveOutreachDraft(userId, { agentId, leadId: lead.id, subject: result.subject, body: result.body, rationale: result.rationale });
          reply = `Sent a follow-up nudge to ${lead.name} — check the Deals page to read it.`;
        }
      }
    } else if (intent.capability === "book-meeting") {
      const parsed = await parseMeetingRequest(intent.query || requestText);
      if (!parsed) {
        reply = `I couldn't figure out a time from that — try something like "next Tuesday at 2pm".`;
      } else {
        const leads = await listLeads(userId);
        const lead = parsed.brandName ? findLeadByName(leads, parsed.brandName) : null;
        const title = lead ? `Call with ${lead.name}` : parsed.brandName ? `Call with ${parsed.brandName}` : "Brand call";
        await createMeeting(userId, { title, kind: "call", whenAt: new Date(parsed.iso), whenLabel: parsed.label, leadId: lead?.id ?? null, agentId });
        reply = `Booked "${title}" for ${parsed.label} — check your Calendar.`;
      }
    }
  } catch {
    reply = "Something went wrong on my end — try again in a moment.";
  }

  await addMessage(userId, { who: "ai", agentId, text: reply });

  revalidatePath("/chat");
}
