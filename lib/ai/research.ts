import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { Lead } from "@/lib/leads/types";

export interface ResearchResult {
  summary: string;
  priorities: string[];
  hooks: string[];
  angle: string;
}

const RESEARCH_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    priorities: { type: "array", items: { type: "string" } },
    hooks: { type: "array", items: { type: "string" } },
    angle: { type: "string" },
  },
  required: ["summary", "priorities", "hooks", "angle"],
};

type LeadInput = Pick<Lead, "name" | "company" | "platform" | "email">;

function fallbackResearch(lead: LeadInput): ResearchResult {
  const brand = lead.company || lead.name;
  return {
    summary: `Research brief unavailable (Gemini not configured). ${brand} is a brand you're considering pitching.`,
    priorities: [],
    hooks: [],
    angle: "Lead with your audience fit and past results once you have more brand context.",
  };
}

// Pure: takes the agent, the brand, and the creator's Media Kit summary —
// makes one Gemini call, returns a typed result. Never touches the database.
export async function draftResearch(agentName: string, lead: LeadInput, creatorContext: string): Promise<ResearchResult> {
  if (!isGeminiConfigured()) return fallbackResearch(lead);

  const brand = lead.company || lead.name;
  const system = `You are ${agentName}, a sharp brand-partnerships researcher working for a content creator. Your job: write a short internal brief the creator's outreach will use to personalize a pitch to this brand. Be concrete and specific rather than generic. This is an internal working brief, not a public claim — if you don't have firm facts about the brand, reason plausibly from its name, platform, and likely industry, and don't invent specifics as if verified.

The creator's own profile (for fit and voice):
${creatorContext || "No profile filled in yet — keep this general."}

Return ONLY JSON matching the schema: { summary: string (2-3 sentences on what this brand is and does), priorities: string[] (2-4 short items on what the brand likely cares about in a partnership), hooks: string[] (2-3 concrete opening angles), angle: string (one sentence: the single best angle for this pitch) }.`;

  const turns: { role: "user"; text: string }[] = [
    { role: "user", text: `Brand: ${brand}\nPlatform/profile: ${lead.platform || "unknown"}\nContact: ${lead.email || "unknown"}` },
  ];

  try {
    const result = await geminiJSON<ResearchResult>(system, turns, RESEARCH_SCHEMA, { maxTokens: 500, temperature: 0.6 });
    const fb = fallbackResearch(lead);
    return {
      summary: result.summary?.trim() || fb.summary,
      priorities: Array.isArray(result.priorities) ? result.priorities.filter(Boolean) : [],
      hooks: Array.isArray(result.hooks) ? result.hooks.filter(Boolean) : [],
      angle: result.angle?.trim() || fb.angle,
    };
  } catch {
    return fallbackResearch(lead);
  }
}
