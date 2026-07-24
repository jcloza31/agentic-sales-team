"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAgent, updateAgent, setAgentPaused, removeAgent } from "./store";

export async function createAgentAction(input: { name: string; role: string; color: string; capabilities: string[]; goal?: string }) {
  const { userId } = await auth();
  if (!userId) return null;
  const id = await createAgent(userId, input);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
  return id;
}

export async function updateAgentAction(
  id: string,
  patch: { role?: string; goal?: string; name?: string; color?: string; capabilities?: string[] }
) {
  const { userId } = await auth();
  if (!userId) return;
  await updateAgent(userId, id, patch);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function setAgentPausedAction(id: string, paused: boolean) {
  const { userId } = await auth();
  if (!userId) return;
  await setAgentPaused(userId, id, paused);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function removeAgentAction(id: string) {
  const { userId } = await auth();
  if (!userId) return;
  await removeAgent(userId, id);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}
