import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import Database from "better-sqlite3";
import { db } from "../lib/db";

function assertIntegrity(path: string) {
  const snapshot = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const rows = snapshot.pragma("integrity_check") as Array<{ integrity_check: string }>;
    if (rows.length === 0 || rows.some((row) => row.integrity_check !== "ok")) {
      throw new Error(`SQLite integrity check failed for ${path}.`);
    }
  } finally {
    snapshot.close();
  }
}

async function main() {
  const backupPath = process.env.RESTORE_FILE ? resolve(process.env.RESTORE_FILE) : "";
  const targetPath = resolve(process.env.DATABASE_PATH ?? "./data/docknest.db");
  if (!backupPath || !existsSync(backupPath)) {
    throw new Error("Set RESTORE_FILE to an existing verified backup file.");
  }
  if (backupPath === targetPath) throw new Error("RESTORE_FILE and DATABASE_PATH must be different files.");
  const checksumPath = `${backupPath}.sha256`;
  if (!existsSync(checksumPath)) throw new Error(`Backup checksum file is missing: ${checksumPath}`);
  const [expected] = readFileSync(checksumPath, "utf8").trim().split(/\s+/);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(backupPath)) hash.update(chunk);
  const actual = hash.digest("hex");
  if (!expected || expected !== actual) throw new Error("Backup SHA-256 checksum does not match.");
  assertIntegrity(backupPath);

  const previous = existsSync(targetPath)
    ? `${targetPath}.pre-restore-${new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replace(/\.\d{3}/, "")}`
    : null;
  if (previous) copyFileSync(targetPath, previous);
  await db.close();
  try {
    copyFileSync(backupPath, targetPath);
    assertIntegrity(targetPath);
  } catch (error) {
    if (previous) copyFileSync(previous, targetPath);
    throw error;
  }
  console.log(`Restored ${basename(backupPath)} to ${targetPath}${previous ? `. Previous database preserved at ${previous}` : ""}.`);
}

main().catch((error: unknown) => {
  console.error("Database restore failed.", error);
  process.exitCode = 1;
});
