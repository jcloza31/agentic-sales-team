import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { disconnectTiktokAccount } from "@/lib/tiktok/store";

export const runtime = "nodejs";

function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
}

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(appUrl("/sign-in"));
  await disconnectTiktokAccount(user.userId);
  return NextResponse.redirect(appUrl("/settings?tiktok=disconnected"));
}
