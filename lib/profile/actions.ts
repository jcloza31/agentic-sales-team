"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { saveProfile } from "./store";
import type { CreatorProfileData } from "./types";

export async function saveProfileAction(data: CreatorProfileData) {
  const { userId } = await auth();
  if (!userId) return;
  await saveProfile(userId, data);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
