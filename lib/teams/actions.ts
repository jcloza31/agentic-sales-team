"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createTeam, updateTeamMembers, updateTeamDetails } from "./store";

export async function createTeamAction(input: { name: string; description?: string; members: string[] }) {
  const { userId } = await auth();
  if (!userId) return null;
  const id = await createTeam(userId, input);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
  return id;
}

export async function updateTeamMembersAction(id: string, members: string[]) {
  const { userId } = await auth();
  if (!userId) return;
  await updateTeamMembers(userId, id, members);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function updateTeamDetailsAction(id: string, patch: { name?: string; description?: string }) {
  const { userId } = await auth();
  if (!userId) return;
  await updateTeamDetails(userId, id, patch);
  revalidatePath("/agents");
}
