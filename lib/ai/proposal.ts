import { geminiJSON, isGeminiConfigured } from "./gemini";
import { PITCH_GUARDRAILS } from "./guardrails";
import type { Lead } from "@/lib/leads/types";

export interface ProposalResult {
  title: string;
  body: string;
  packages: string[];
}

const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    packages: { type: "array", items: { type: "string" } },
  },
  required: ["title", "body", "packages"],
};

type LeadInput = Pick<Lead, "name" | "company" | "research">;

function fallbackProposal(lead: LeadInput, creatorName: string): ProposalResult {
  const brand = lead.company || lead.name;
  return {
    title: `Partnership Proposal — ${brand}`,
    body: `Hi,\n\nThank you for considering a partnership with me. I'd love to put together a package that fits ${brand}'s goals — once we've had a chance to talk specifics, I can tailor the scope and pricing to match.\n\nLooking forward to it,\n${creatorName}\n\n(Fallback proposal — Gemini not configured.)`,
    packages: [],
  };
}

// Pure: grounded in the creator's Media Kit (rate floor especially) plus
// the brand's research brief. No separate rate-card catalog exists.
export async function draftProposal(agentName: string, lead: LeadInput, creatorContext: string, creatorName: string): Promise<ProposalResult> {
  if (!isGeminiConfigured()) return fallbackProposal(lead, creatorName);

  const brand = lead.company || lead.name;
  const research = lead.research;

  const system = `You ARE ${creatorName}, writing your own priced partnership proposal for ${brand}. You work with ${agentName}, your proposal helper, but their identity never appears in the message.

There is no separate rate-card catalog — ground your scope and pricing entirely in your own Media Kit below, especially your rate floor. Never price below your rate floor. Offer 2-4 deliverable packages that fit your own platforms. Write a 150-250 word body: friendly, confident, concrete, ending in a soft next step (e.g. "happy to hop on a call"). No hype, no emojis, no exclamation marks.

${PITCH_GUARDRAILS}

Your Media Kit:
${creatorContext || "No profile filled in yet — keep pricing conservative and general."}

Return ONLY JSON matching the schema: { title: string, body: string, packages: string[] (2-4 short deliverable package names with a price, e.g. "1 Reel + 2 Stories — $750") }.`;

  const turns: { role: "user"; text: string }[] = [
    {
      role: "user",
      text:
        `Brand: ${brand}\n` +
        (research
          ? `Research brief — summary: ${research.summary}\nPriorities: ${research.priorities.join(", ")}\nBest angle: ${research.angle}`
          : "No research brief yet — use your best judgment."),
    },
  ];

  try {
    const result = await geminiJSON<ProposalResult>(system, turns, PROPOSAL_SCHEMA, { maxTokens: 700, temperature: 0.6 });
    const fb = fallbackProposal(lead, creatorName);
    return {
      title: result.title?.trim() || fb.title,
      body: result.body?.trim() || fb.body,
      packages: Array.isArray(result.packages) ? result.packages.filter(Boolean) : [],
    };
  } catch (err) {
    console.error("[proposal.ts] Gemini call failed:", err);
    return fallbackProposal(lead, creatorName);
  }
}
