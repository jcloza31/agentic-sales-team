import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { users } from "./schema";

export async function ensureUser(id: string, email: string | null, name: string | null) {
  const db = getDb();
  if (!db) return;
  await db
    .insert(users)
    .values({ id, email, name })
    .onConflictDoUpdate({ target: users.id, set: { email, name } });
}

export async function getUserRow(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateNotifications(id: string, notifications: Record<string, boolean>) {
  const db = getDb();
  if (!db) return;
  await db.update(users).set({ notifications }).where(eq(users.id, id));
}
