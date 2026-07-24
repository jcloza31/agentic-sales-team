import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Next.js loads .env.local automatically for the app; this standalone
// script doesn't get that for free, so read it by hand.
function loadEnvLocal() {
  let content;
  try {
    content = readFileSync(path.join(root, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log("No DATABASE_URL set — skipping migrations. The app will still run without a database.");
  process.exit(0);
}

const migrationsDir = path.join(root, "lib", "db", "migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      create table if not exists _migrations (
        id serial primary key,
        name text unique not null,
        applied_at timestamptz not null default now()
      );
    `);

    const { rows } = await client.query("select name from _migrations");
    const applied = new Set(rows.map((r) => r.name));

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`Applying ${file}...`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into _migrations (name) values ($1)", [file]);
        await client.query("commit");
        ran++;
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }

    console.log(ran > 0 ? `Applied ${ran} migration(s).` : "Already up to date — nothing to apply.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
