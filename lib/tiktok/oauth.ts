import "server-only";
import crypto from "crypto";

export function isTiktokConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET && process.env.NEXT_PUBLIC_APP_URL);
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

export function redirectUri(): string {
  return `${baseUrl()}/api/tiktok/callback`;
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function makeCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    response_type: "code",
    scope: "user.info.profile,user.info.stats",
    redirect_uri: redirectUri(),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export interface TiktokTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
}

async function requestToken(body: URLSearchParams): Promise<TiktokTokens> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`TikTok token request failed: ${data.error_description || data.error || res.status}`);
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, openId: data.open_id };
}

export function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TiktokTokens> {
  return requestToken(
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code_verifier: codeVerifier,
    })
  );
}

export function refreshAccessToken(refreshToken: string): Promise<TiktokTokens> {
  return requestToken(
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

export interface TiktokUserInfo {
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  username?: string;
}

export async function fetchTiktokUserInfo(accessToken: string): Promise<TiktokUserInfo> {
  const fields = "display_name,avatar_url,follower_count,username";
  const res = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`TikTok user info failed: ${data.error?.message || res.status}`);
  }
  const u = data?.data?.user ?? {};
  return {
    displayName: u.display_name ?? "",
    avatarUrl: u.avatar_url ?? "",
    followerCount: typeof u.follower_count === "number" ? u.follower_count : 0,
    username: u.username ?? undefined,
  };
}
