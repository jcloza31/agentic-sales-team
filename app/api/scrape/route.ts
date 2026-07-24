import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { getProfile } from "@/lib/profile/store";
import { isFirecrawlConfigured, firecrawlSearch } from "@/lib/discovery/firecrawl";
import { extractBrandCandidates, fallbackBrandCandidates } from "@/lib/ai/discovery";
import { addDiscoveredLeads } from "@/lib/leads/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const profile = await getProfile(user.userId);
  const niche = profile.niche || "content creator sponsorships";

  let candidates;
  if (isFirecrawlConfigured()) {
    try {
      const results = await firecrawlSearch(`brands that sponsor ${niche} content creators influencer partnerships`, 8);
      candidates = await extractBrandCandidates(niche, results);
      if (candidates.length === 0) candidates = fallbackBrandCandidates();
    } catch {
      candidates = fallbackBrandCandidates();
    }
  } else {
    candidates = fallbackBrandCandidates();
  }

  const count = await addDiscoveredLeads(user.userId, candidates);
  return NextResponse.json({ count });
}
