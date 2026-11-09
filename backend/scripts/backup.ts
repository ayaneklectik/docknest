import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import Database from "better-sqlite3";
import { db } from "../lib/db";

async function main() {
  const directory = resolve(process.env.BACKUP_DIR ?? "./backups");
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 14);
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
    throw new Error("BACKUP_RETENTION_DAYS must be between 1 and 3650.");
  }
  mkdirSync(directory, { recursive: true });
  const timestamp = new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replace(/\.\d{3}/, "");
  const destination = join(directory, `docknest-${timestamp}.db`);
  await db.backup(destination);
  const snapshot = new Database(destination, { readonly: true, fileMustExist: true });
  const integrity = snapshot.pragma("integrity_check") as Array<{ integrity_check: string }>;
  snapshot.close();
  if (integrity.length === 0 || integrity.some((row) => row.integrity_check !== "ok")) {
    throw new Error(`Backup integrity check failed for ${destination}.`);
  }
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(destination)) hash.update(chunk);
  const digest = hash.digest("hex");
  writeFileSync(`${destination}.sha256`, `${digest}  ${basename(destination)}\n`, { flag: "wx" });

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const filename of readdirSync(directory)) {
    if (!/^docknest-\d{8}T\d{6}Z\.db(?:\.sha256)?$/.test(filename)) continue;
    const path = join(directory, filename);
    if (path === destination || path === `${destination}.sha256`) continue;
    if (statSync(path).mtimeMs < cutoff) unlinkSync(path);
  }

  console.log(`Created and integrity-checked backup: ${destination}`);
}

main().catch((error: unknown) => {
  console.error("Database backup failed.", error);
  process.exitCode = 1;
});
