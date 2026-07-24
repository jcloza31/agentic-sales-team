import { geminiJSON, isGeminiConfigured } from "./gemini";

export type ChatCapability = "scrape" | "research" | "outreach" | "proposal" | "follow-up" | "book-meeting" | "chat";

export interface ChatIntent {
  capability: ChatCapability;
  query: string;
  reply: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    capability: { type: "string", enum: ["scrape", "research", "outreach", "proposal", "follow-up", "book-meeting", "chat"] },
    query: { type: "string" },
    reply: { type: "string" },
  },
  required: ["capability", "query", "reply"],
};

// Reads a chat message and decides which real job (if any) it's asking
// for. Pure — the caller runs the actual engine and posts the reply.
export async function classifyChatIntent(agentName: string, message: string): Promise<ChatIntent> {
  if (!isGeminiConfigured()) {
    return {
      capability: "chat",
      query: "",
      reply: "I heard you, but I need my AI brain switched on (a Gemini key) to actually act on requests like that.",
    };
  }

  const system = `You are ${agentName}, an AI teammate in a content creator's brand-deal group chat. A teammate was just @mentioned with a request. Classify what they want:
- "scrape": find/discover new brands (e.g. "find me some fitness brands"). query = a short search phrase describing the kind of brands wanted.
- "research": write a research brief on a specific brand already in their pipeline. query = the brand name mentioned.
- "outreach": draft a first pitch to a specific brand. query = the brand name mentioned.
- "proposal": draft a priced proposal for a specific brand. query = the brand name mentioned.
- "follow-up": follow up with a specific brand that's gone quiet. query = the brand name mentioned.
- "book-meeting": book a call. query = the whole phrase describing the brand and time (e.g. "Acme next Tuesday at 2pm").
- "chat": anything else, unclear, or just conversation. query = "".

Also write a short, in-character one-sentence "reply" acknowledging the request in your voice (used only if this ends up being just conversation, never shown when a real task runs). Return ONLY JSON matching the schema.`;

  const turns: { role: "user"; text: string }[] = [{ role: "user", text: message }];

  try {
    const result = await geminiJSON<ChatIntent>(system, turns, SCHEMA, { maxTokens: 200, temperature: 0.3 });
    return {
      capability: result.capability || "chat",
      query: result.query?.trim() || "",
      reply: result.reply?.trim() || "Got it!",
    };
  } catch (err) {
    console.error("[chatIntent.ts] Gemini call failed:", err);
    return { capability: "chat", query: "", reply: "Sorry, I couldn't process that just now." };
  }
}
