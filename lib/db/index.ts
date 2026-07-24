import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db | null {
  if (!isDbConfigured()) return null;
  if (!cached) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    cached = drizzle(pool, { schema });
  }
  return cached;
}
