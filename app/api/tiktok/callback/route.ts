import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth/currentUser";
import { exchangeCodeForToken, fetchTiktokUserInfo } from "@/lib/tiktok/oauth";
import { saveTiktokAccount } from "@/lib/tiktok/store";

export const runtime = "nodejs";

function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(appUrl("/sign-in"));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const jar = await cookies();
  const savedState = jar.get("tiktok_state")?.value;
  const codeVerifier = jar.get("tiktok_verifier")?.value;
  jar.delete("tiktok_state");
  jar.delete("tiktok_verifier");

  if (errorParam || !code || !state || !savedState || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(appUrl("/settings?tiktok=error"));
  }

  try {
    const tokens = await exchangeCodeForToken(code, codeVerifier);
    const info = await fetchTiktokUserInfo(tokens.accessToken);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    await saveTiktokAccount(user.userId, {
      openId: tokens.openId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      displayName: info.displayName,
      username: info.username ?? null,
      avatarUrl: info.avatarUrl,
      followerCount: info.followerCount,
    });
    return NextResponse.redirect(appUrl("/settings?tiktok=connected"));
  } catch (err) {
    console.error("[tiktok/callback] failed:", err);
    return NextResponse.redirect(appUrl("/settings?tiktok=error"));
  }
}
