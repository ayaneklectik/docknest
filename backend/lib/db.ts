import "dotenv/config";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

if (process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not supported. This build uses SQLite; PostgreSQL requires a separate persistence migration."
  );
}

const databasePath = resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH ?? "./data/docknest.db");
mkdirSync(dirname(databasePath), { recursive: true });

const globalForDatabase = globalThis as typeof globalThis & {
  docknestDatabase?: Database.Database;
};

export const db =
  globalForDatabase.docknestDatabase ??
  new Database(databasePath, {
    fileMustExist: false,
    timeout: 5000
  });

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.docknestDatabase = db;
}

export function isBusinessDatabaseReady(): boolean {
  const migrationTable = db
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'"
    )
    .get();
  return Boolean(migrationTable);
}
