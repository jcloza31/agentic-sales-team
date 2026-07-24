import { geminiJSON, isGeminiConfigured } from "./gemini";
import { PITCH_GUARDRAILS } from "./guardrails";
import type { Lead } from "@/lib/leads/types";

export interface FollowupResult {
  subject: string;
  body: string;
  rationale: string;
}

const FOLLOWUP_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    rationale: { type: "string" },
  },
  required: ["subject", "body", "rationale"],
};

type LeadInput = Pick<Lead, "name" | "company">;

function fallbackFollowup(lead: LeadInput, creatorName: string): FollowupResult {
  const brand = lead.company || lead.name;
  return {
    subject: "Circling back",
    body: `Hi again,\n\nJust wanted to circle back on my last note — I'm still really excited about the idea of working with ${brand}. Let me know if you'd like to pick the conversation back up, no pressure either way.\n\nBest,\n${creatorName}`,
    rationale: "Fallback follow-up (Gemini not configured).",
  };
}

// Pure: a short, warm nudge that builds on the prior pitch (passed in as
// `priorPitchBody`) rather than repeating it.
export async function draftFollowup(
  agentName: string,
  lead: LeadInput,
  priorPitchBody: string,
  creatorContext: string,
  creatorName: string
): Promise<FollowupResult> {
  if (!isGeminiConfigured()) return fallbackFollowup(lead, creatorName);

  const brand = lead.company || lead.name;

  const system = `You ARE ${creatorName}, writing a short, warm follow-up to a brand that's gone quiet since your last message. You work with ${agentName}, your follow-up helper, but their identity never appears in the message.

Keep it short (3-5 sentences), friendly, no pressure, and build naturally on what you already said — don't repeat the whole pitch, just a brief, warm nudge. No hype, no emojis, no exclamation marks.

${PITCH_GUARDRAILS}

Your Media Kit:
${creatorContext || "No profile filled in yet."}

Return ONLY JSON matching the schema: { subject: string, body: string, rationale: string }.`;

  const turns: { role: "user"; text: string }[] = [{ role: "user", text: `Brand: ${brand}\nYour last message to them:\n${priorPitchBody}` }];

  try {
    const result = await geminiJSON<FollowupResult>(system, turns, FOLLOWUP_SCHEMA, { maxTokens: 400, temperature: 0.6 });
    const fb = fallbackFollowup(lead, creatorName);
    return {
      subject: result.subject?.trim() || fb.subject,
      body: result.body?.trim() || fb.body,
      rationale: result.rationale?.trim() || fb.rationale,
    };
  } catch {
    return fallbackFollowup(lead, creatorName);
  }
}
