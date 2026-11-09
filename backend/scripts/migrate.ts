import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../lib/auth";
import { db } from "../lib/db";

async function main() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const migrationDirectory = resolve("database/migrations");
  const businessMigrations = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of businessMigrations) {
    const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?").get(name);
    if (applied) continue;

    const sql = readFileSync(resolve(migrationDirectory, name), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(name);
    });
    apply();
    console.log(`Applied migration ${name}`);
  }

  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  if (toBeCreated.length > 0 || toBeAdded.length > 0) {
    await runMigrations();
    console.log("Applied Better Auth schema migrations.");
  } else {
    console.log("Better Auth schema is up to date.");
  }
}

main().catch((error: unknown) => {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
});
