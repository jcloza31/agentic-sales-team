import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { SearchResult } from "@/lib/discovery/firecrawl";

export interface BrandCandidate {
  name: string;
  company: string;
  platform: string;
  profileUrl: string;
  website: string;
}

const CANDIDATES_SCHEMA = {
  type: "object",
  properties: {
    brands: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          company: { type: "string" },
          platform: { type: "string" },
          profileUrl: { type: "string" },
          website: { type: "string" },
        },
        required: ["name", "company"],
      },
    },
  },
  required: ["brands"],
};

// Turns raw web-search results into a short list of plausible brand
// candidates. Pure — the caller decides what to do with the list.
export async function extractBrandCandidates(niche: string, results: SearchResult[]): Promise<BrandCandidate[]> {
  if (!isGeminiConfigured() || results.length === 0) return [];

  const system = `You are a research assistant helping a content creator in the "${niche}" niche find brands that sponsor creators like them. You'll be given raw web search results. Extract distinct real BRANDS (not articles, not generic sites, not the niche description itself) that look like plausible sponsorship partners. For each, include their official website homepage if it can be determined from the results, and a social media profile URL if one appears. Skip duplicates. Return ONLY JSON matching the schema.`;

  const turns: { role: "user"; text: string }[] = [
    { role: "user", text: results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.description}`).join("\n\n") },
  ];

  try {
    const result = await geminiJSON<{ brands: BrandCandidate[] }>(system, turns, CANDIDATES_SCHEMA, { maxTokens: 800, temperature: 0.4 });
    return Array.isArray(result.brands) ? result.brands.filter((b) => b.name || b.company) : [];
  } catch (err) {
    console.error("[discovery.ts] Gemini call failed:", err);
    return [];
  }
}

// The offline/no-key safety net — a small canned set so the flow still
// completes. A real fallback, not a separate feature.
export function fallbackBrandCandidates(): BrandCandidate[] {
  return [
    { name: "Glow Skincare", company: "Glow Skincare Co.", platform: "Instagram", profileUrl: "https://instagram.com/glowskincare", website: "https://glowskincare.com" },
    { name: "Verve Apparel", company: "Verve Apparel", platform: "TikTok", profileUrl: "https://tiktok.com/@verveapparel", website: "https://verveapparel.com" },
    { name: "Solstice Eyewear", company: "Solstice Eyewear", platform: "Instagram", profileUrl: "https://instagram.com/solsticeeyewear", website: "https://solsticeeyewear.com" },
  ];
}
