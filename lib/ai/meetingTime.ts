import { geminiJSON, isGeminiConfigured } from "./gemini";

export interface ParsedTime {
  iso: string;
  label: string;
}

const TIME_SCHEMA = {
  type: "object",
  properties: {
    iso: { type: "string" },
    label: { type: "string" },
  },
  required: ["iso", "label"],
};

function friendlyLabel(d: Date): string {
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Parses a phrase like "next Tuesday at 2pm" into a precise timestamp.
// Returns null with no Gemini key — the caller falls back to a plain
// date/time picker so booking still works.
export async function parseMeetingTime(text: string, now: Date = new Date()): Promise<ParsedTime | null> {
  if (!isGeminiConfigured() || !text.trim()) return null;

  const system = `You convert a natural-language date/time phrase into a precise timestamp. The current date and time is ${now.toString()} (ISO: ${now.toISOString()}). Assume the phrase refers to the near future unless it clearly says otherwise. Return the timestamp as ISO 8601, and a short friendly label like "Tue, Jul 29 at 2:00 PM". Return ONLY JSON matching the schema.`;
  const turns: { role: "user"; text: string }[] = [{ role: "user", text }];

  try {
    const result = await geminiJSON<ParsedTime>(system, turns, TIME_SCHEMA, { maxTokens: 150, temperature: 0.2 });
    if (!result.iso) return null;
    const d = new Date(result.iso);
    if (isNaN(d.getTime())) return null;
    return { iso: d.toISOString(), label: result.label?.trim() || friendlyLabel(d) };
  } catch {
    return null;
  }
}

export interface ParsedMeetingRequest extends ParsedTime {
  brandName: string;
}

const REQUEST_SCHEMA = {
  type: "object",
  properties: {
    brandName: { type: "string" },
    iso: { type: "string" },
    label: { type: "string" },
  },
  required: ["iso", "label"],
};

// Parses a full booking request like "book a call with Acme next Tuesday
// at 2pm" — extracting both the brand mentioned and the time.
export async function parseMeetingRequest(text: string, now: Date = new Date()): Promise<ParsedMeetingRequest | null> {
  if (!isGeminiConfigured() || !text.trim()) return null;

  const system = `You read a short request to book a brand call, like "book a call with Acme next Tuesday at 2pm". The current date and time is ${now.toString()} (ISO: ${now.toISOString()}). Extract: the brand or company name mentioned (empty string if none), the precise timestamp as ISO 8601, and a short friendly label like "Tue, Jul 29 at 2:00 PM". Return ONLY JSON matching the schema.`;
  const turns: { role: "user"; text: string }[] = [{ role: "user", text }];

  try {
    const result = await geminiJSON<ParsedMeetingRequest>(system, turns, REQUEST_SCHEMA, { maxTokens: 200, temperature: 0.2 });
    if (!result.iso) return null;
    const d = new Date(result.iso);
    if (isNaN(d.getTime())) return null;
    return { iso: d.toISOString(), label: result.label?.trim() || friendlyLabel(d), brandName: result.brandName?.trim() ?? "" };
  } catch {
    return null;
  }
}
