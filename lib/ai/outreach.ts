import { geminiJSON, isGeminiConfigured } from "./gemini";
import { PITCH_GUARDRAILS } from "./guardrails";
import type { Lead } from "@/lib/leads/types";

export interface OutreachResult {
  score: number;
  stage: "new" | "pitched" | "negotiating" | "replied" | "booked";
  subject: string;
  body: string;
  rationale: string;
}

const OUTREACH_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    stage: { type: "string", enum: ["new", "pitched", "negotiating", "replied", "booked"] },
    subject: { type: "string" },
    body: { type: "string" },
    rationale: { type: "string" },
  },
  required: ["score", "stage", "subject", "body", "rationale"],
};

type LeadInput = Pick<Lead, "name" | "company" | "email" | "platform" | "research">;

function fallbackOutreach(lead: LeadInput, creatorName: string): OutreachResult {
  const brand = lead.company || lead.name;
  const hasEmail = Boolean(lead.email);
  const body = hasEmail
    ? `Hi there,\n\nI'm ${creatorName}, and I've been a fan of ${brand} for a while. I think there could be a great fit between your brand and my audience — I'd love to put together a partnership.\n\nWould you be open to a quick chat about what that could look like?\n\nBest,\n${creatorName}`
    : `Hi! I'm ${creatorName} — I love what ${brand} is doing and think my audience would too. Would you be open to a quick chat about a possible partnership?`;
  return {
    score: 58,
    stage: "pitched",
    subject: hasEmail ? `Partnership idea with ${creatorName}` : "",
    body,
    rationale: "Fallback pitch (Gemini not configured).",
  };
}

// Pure: agent + brand + Media Kit in, typed pitch out. Never touches the database.
export async function draftOutreach(agentName: string, lead: LeadInput, creatorContext: string, creatorName: string): Promise<OutreachResult> {
  if (!isGeminiConfigured()) return fallbackOutreach(lead, creatorName);

  const brand = lead.company || lead.name;
  const hasEmail = Boolean(lead.email);
  const research = lead.research;

  const system = `You ARE ${creatorName} — a real creator writing your OWN outreach. Write in first person: I / my / me. You work with ${agentName}, your outreach helper, but their identity never appears in the message.

Two jobs: (1) score this brand's fit 0-100 and pick the pipeline stage (usually "pitched" for a first touch), (2) write the pitch.

Channel rules: ${hasEmail ? "this brand has an email — write a polished 90-140 word partnership email with a real salutation and a sign-off with your name." : "this brand only has a social profile — write a short 2-4 sentence DM."} No hype, no emojis, no exclamation marks, no placeholder tokens like [Brand].

${PITCH_GUARDRAILS}

Your Media Kit:
${creatorContext || "No profile filled in yet — keep it general but still first-person and confident."}

Return ONLY JSON matching the schema.`;

  const turns: { role: "user"; text: string }[] = [
    {
      role: "user",
      text:
        `Brand: ${brand}\nContact: ${hasEmail ? lead.email : lead.platform || "social profile only"}\n` +
        (research
          ? `Research brief — summary: ${research.summary}\nPriorities: ${research.priorities.join(", ")}\nBest angle: ${research.angle}`
          : "No research brief yet — use your best judgment."),
    },
  ];

  try {
    const result = await geminiJSON<OutreachResult>(system, turns, OUTREACH_SCHEMA, { maxTokens: 700, temperature: 0.6 });
    const fb = fallbackOutreach(lead, creatorName);
    return {
      score: typeof result.score === "number" ? result.score : fb.score,
      stage: result.stage || fb.stage,
      subject: result.subject?.trim() ?? fb.subject,
      body: result.body?.trim() || fb.body,
      rationale: result.rationale?.trim() || fb.rationale,
    };
  } catch (err) {
    console.error("[outreach.ts] Gemini call failed:", err);
    return fallbackOutreach(lead, creatorName);
  }
}
