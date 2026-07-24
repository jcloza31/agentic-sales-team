import "server-only";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { TEAM_TEMPLATES, type TeamTemplate } from "@/lib/agentTypes";

export interface MergedTeam {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  description: string;
  members: string[];
  type: "preset" | "custom";
}

function presetToMerged(t: TeamTemplate): MergedTeam {
  return {
    id: t.id,
    name: t.name,
    icon: "team",
    iconBg: "#ffb020",
    description: "Your ready-made squad — discovers, pitches, proposes, follows up, and books, end to end.",
    members: t.members,
    type: "preset",
  };
}

export async function listTeams(userId: string): Promise<MergedTeam[]> {
  const presets = TEAM_TEMPLATES.map(presetToMerged);
  const db = getDb();
  if (!db) return presets;

  const [customRows, memberRows] = await Promise.all([
    db.select().from(teams).where(eq(teams.userId, userId)),
    db.select().from(teamMembers).where(eq(teamMembers.userId, userId)),
  ]);

  const custom: MergedTeam[] = customRows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon ?? "team",
    iconBg: r.iconBg ?? "#7c5cff",
    description: r.description ?? "",
    members: (r.members as string[]) ?? [],
    type: "custom",
  }));

  const memberOverride = new Map(memberRows.map((m) => [m.teamId, (m.members as string[]) ?? []]));

  return [...presets, ...custom].map((t) => (memberOverride.has(t.id) ? { ...t, members: memberOverride.get(t.id)! } : t));
}

export async function getTeam(userId: string, id: string): Promise<MergedTeam | null> {
  const all = await listTeams(userId);
  return all.find((t) => t.id === id) ?? null;
}

export async function createTeam(userId: string, input: { name: string; description?: string; members: string[] }): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const id = "team-" + Math.random().toString(36).slice(2, 8);
  await db.insert(teams).values({
    userId,
    id,
    name: input.name,
    description: input.description ?? "",
    members: input.members,
    icon: "team",
    iconBg: "#7c5cff",
  });
  return id;
}

export async function updateTeamMembers(userId: string, id: string, members: string[]) {
  const db = getDb();
  if (!db) return;
  const isPreset = TEAM_TEMPLATES.some((t) => t.id === id);

  if (isPreset) {
    await db
      .insert(teamMembers)
      .values({ userId, teamId: id, members })
      .onConflictDoUpdate({ target: [teamMembers.userId, teamMembers.teamId], set: { members } });
    return;
  }
  await db.update(teams).set({ members }).where(and(eq(teams.userId, userId), eq(teams.id, id)));
}

export async function updateTeamDetails(userId: string, id: string, patch: { name?: string; description?: string }) {
  const db = getDb();
  if (!db) return;
  const isPreset = TEAM_TEMPLATES.some((t) => t.id === id);
  if (isPreset) return;

  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.description !== undefined) set.description = patch.description;
  if (Object.keys(set).length === 0) return;
  await db.update(teams).set(set).where(and(eq(teams.userId, userId), eq(teams.id, id)));
}
