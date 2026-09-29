import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db.js";

const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

// A database created earlier with `drizzle-kit push` already has the tables but no migration record.
// Record the first migration as applied so the migrator doesn't try to create them again.
async function adoptPushedDatabase() {
  const { rows } = await pool.query(
    `select to_regclass('public.users') as users, to_regclass('drizzle.__drizzle_migrations') as log`,
  );
  if (!rows[0].users || rows[0].log) return;
  const journal = JSON.parse(fs.readFileSync(path.join(folder, "meta/_journal.json"), "utf8"));
  const first = journal.entries[0];
  const sqlText = fs.readFileSync(path.join(folder, `${first.tag}.sql`), "utf8");
  const hash = crypto.createHash("sha256").update(sqlText).digest("hex");
  await pool.query(`create schema if not exists drizzle`);
  await pool.query(`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`);
  await pool.query(`insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)`, [hash, first.when]);
  console.log(`[db] Existing database adopted at migration ${first.tag}`);
}

// Applies any pending SQL migrations from /migrations on boot
export async function runMigrations() {
  await adoptPushedDatabase();
  await migrate(db, { migrationsFolder: folder });
  console.log("[db] Migrations up to date");
}
