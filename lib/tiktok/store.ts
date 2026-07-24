import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { refreshAccessToken, fetchTiktokUserInfo } from "./oauth";

export interface TiktokAccount {
  displayName: string;
  username: string | null;
  avatarUrl: string;
  followerCount: number;
}

export async function getTiktokAccount(userId: string): Promise<TiktokAccount | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { displayName: row.displayName, username: row.username, avatarUrl: row.avatarUrl, followerCount: row.followerCount };
}

export async function saveTiktokAccount(
  userId: string,
  data: {
    openId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    displayName: string;
    username: string | null;
    avatarUrl: string;
    followerCount: number;
  }
) {
  const db = getDb();
  if (!db) return;
  await db
    .insert(tiktokAccounts)
    .values({ userId, ...data })
    .onConflictDoUpdate({ target: tiktokAccounts.userId, set: { ...data, updatedAt: new Date() } });
}

export async function disconnectTiktokAccount(userId: string) {
  const db = getDb();
  if (!db) return;
  await db.delete(tiktokAccounts).where(eq(tiktokAccounts.userId, userId));
}

/** Reads the connected account, silently refreshing the follower count when the access token is stale. */
export async function getFreshTiktokAccount(userId: string): Promise<TiktokAccount | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(tiktokAccounts).where(eq(tiktokAccounts.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const stillFresh = row.expiresAt.getTime() - Date.now() > 5 * 60 * 1000;
  if (stillFresh) {
    return { displayName: row.displayName, username: row.username, avatarUrl: row.avatarUrl, followerCount: row.followerCount };
  }

  try {
    const tokens = await refreshAccessToken(row.refreshToken);
    const info = await fetchTiktokUserInfo(tokens.accessToken);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    await saveTiktokAccount(userId, {
      openId: row.openId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      displayName: info.displayName,
      username: info.username ?? null,
      avatarUrl: info.avatarUrl,
      followerCount: info.followerCount,
    });
    return { displayName: info.displayName, username: info.username ?? null, avatarUrl: info.avatarUrl, followerCount: info.followerCount };
  } catch (err) {
    console.error("[tiktok/store] refresh failed:", err);
    return { displayName: row.displayName, username: row.username, avatarUrl: row.avatarUrl, followerCount: row.followerCount };
  }
}
