"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { dismissAllActivity } from "./store";

export async function dismissAllActivityAction() {
  const { userId } = await auth();
  if (!userId) return;
  await dismissAllActivity(userId);
  revalidatePath("/dashboard");
}
