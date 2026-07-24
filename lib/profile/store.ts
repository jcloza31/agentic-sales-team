import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { creatorProfile } from "@/lib/db/schema";
import { EMPTY_PROFILE, type CreatorProfileData } from "./types";

export async function getProfile(userId: string): Promise<CreatorProfileData> {
  const db = getDb();
  if (!db) return EMPTY_PROFILE;
  const rows = await db.select().from(creatorProfile).where(eq(creatorProfile.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return EMPTY_PROFILE;
  return {
    niche: row.niche ?? "",
    bio: row.bio ?? "",
    platforms: (row.platforms as CreatorProfileData["platforms"]) ?? [],
    audience: (row.audience as CreatorProfileData["audience"]) ?? {},
    tone: row.tone ?? "",
    pastDeals: row.pastDeals ?? "",
    rateFloor: row.rateFloor ?? "",
  };
}

export async function saveProfile(userId: string, data: CreatorProfileData) {
  const db = getDb();
  if (!db) return;
  const set = {
    niche: data.niche,
    bio: data.bio,
    platforms: data.platforms,
    audience: data.audience,
    tone: data.tone,
    pastDeals: data.pastDeals,
    rateFloor: data.rateFloor,
    updatedAt: new Date(),
  };
  await db
    .insert(creatorProfile)
    .values({ userId, ...set })
    .onConflictDoUpdate({ target: creatorProfile.userId, set });
}

export function isProfileComplete(data: CreatorProfileData): boolean {
  return Boolean(data.niche.trim() && data.platforms.some((p) => p.platform.trim() && p.handle.trim()) && data.rateFloor.trim());
}

// The text block every AI engine reads as `creatorContext`.
export function profileSummary(data: CreatorProfileData): string {
  if (!data.niche && data.platforms.length === 0) return "";
  const lines: string[] = [];
  lines.push(`Niche: ${data.niche || "not set"}`);
  if (data.bio) lines.push(`Bio: ${data.bio}`);
  if (data.platforms.length) {
    lines.push(
      "Platforms: " +
        data.platforms
          .filter((p) => p.platform.trim())
          .map((p) => `${p.platform} @${p.handle} (${p.followers || "unknown"} followers${p.engagementRate ? `, ${p.engagementRate} engagement` : ""})`)
          .join("; ")
    );
  }
  const aud = data.audience;
  if (aud.age || aud.geo || aud.gender) {
    lines.push("Audience: " + [aud.age && `age ${aud.age}`, aud.geo && `mostly ${aud.geo}`, aud.gender && aud.gender].filter(Boolean).join(", "));
  }
  if (data.tone) lines.push(`Tone/voice: ${data.tone}`);
  if (data.pastDeals) lines.push(`Past deals: ${data.pastDeals}`);
  if (data.rateFloor) lines.push(`Rate floor: ${data.rateFloor}`);
  return lines.join("\n");
}

export function creatorDisplayName(name: string | null, email: string | null): string {
  return name || (email ? email.split("@")[0] : "Creator");
}
