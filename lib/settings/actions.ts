"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { updateNotifications as updateNotificationsRow } from "@/lib/db/users";

export async function updateNotifications(notifications: Record<string, boolean>) {
  const { userId } = await auth();
  if (!userId) return;
  await updateNotificationsRow(userId, notifications);
  revalidatePath("/settings");
}
