import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth/currentUser";
import { isTiktokConfigured, buildAuthorizeUrl, randomToken, makeCodeChallenge } from "@/lib/tiktok/oauth";

export const runtime = "nodejs";

function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(appUrl("/sign-in"));
  if (!isTiktokConfigured()) return NextResponse.redirect(appUrl("/settings?tiktok=not_configured"));

  const state = randomToken(16);
  const codeVerifier = randomToken(32);
  const codeChallenge = makeCodeChallenge(codeVerifier);

  const jar = await cookies();
  jar.set("tiktok_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  jar.set("tiktok_verifier", codeVerifier, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });

  return NextResponse.redirect(buildAuthorizeUrl(state, codeChallenge));
}
