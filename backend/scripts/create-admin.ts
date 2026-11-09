import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { db } from "../lib/db";

function promptHidden(label: string): Promise<string> {
  const input = process.stdin;
  const output = process.stdout;
  if (!input.isTTY || !output.isTTY) {
    throw new Error("Run npm run admin:create from a private interactive terminal so the password can be entered without echo.");
  }

  return new Promise((resolve, reject) => {
    const wasRaw = input.isRaw;
    let value = "";
    output.write(label);
    input.setRawMode(true);
    input.resume();

    const finish = (error?: Error) => {
      input.off("data", onData);
      input.setRawMode(wasRaw ?? false);
      input.pause();
      output.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          finish(new Error("Administrator creation cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };

    input.on("data", onData);
  });
}

async function main() {
  const userTable = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user'")
    .get();
  if (!userTable) {
    throw new Error("Better Auth tables are missing. Run npm run db:migrate first.");
  }
  const existingAdmins = db
    .prepare("SELECT id, email FROM user WHERE role = 'admin' ORDER BY createdAt LIMIT 2")
    .all() as Array<{ id: string; email: string }>;
  if (existingAdmins.length > 1) {
    throw new Error("Multiple administrators exist. Resolve administrator ownership before using this recovery command.");
  }

  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const name = (await prompt.question("Administrator name [Docknest Administrator]: ")).trim() || "Docknest Administrator";
  const email = (await prompt.question("Administrator email: ")).trim().toLowerCase();
  prompt.close();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid administrator email address.");
  }
  const emailOwner = db.prepare("SELECT id FROM user WHERE email = ?").get(email) as { id: string } | undefined;
  const existingAdmin = existingAdmins[0];
  if (emailOwner && emailOwner.id !== existingAdmin?.id) {
    throw new Error("An account with that email already exists.");
  }

  const password = await promptHidden("Administrator password (minimum 14 characters): ");
  const confirmation = await promptHidden("Confirm password: ");
  if (password.length < 14) {
    throw new Error("The password must contain at least 14 characters.");
  }
  if (password !== confirmation) {
    throw new Error("The passwords did not match.");
  }

  const userId = existingAdmin?.id ?? randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const saveAdmin = db.transaction(() => {
    const admins = db.prepare("SELECT id FROM user WHERE role = 'admin' ORDER BY createdAt LIMIT 2").all() as Array<{ id: string }>;
    if (existingAdmin) {
      if (admins.length !== 1 || admins[0]?.id !== existingAdmin.id) {
        throw new Error("Administrator ownership changed while this command was running.");
      }
      db.prepare(
        "UPDATE user SET name = ?, email = ?, emailVerified = 1, updatedAt = ? WHERE id = ?"
      ).run(name, email, now, userId);
      const credentialAccount = db.prepare(
        "UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'"
      ).run(passwordHash, now, userId);
      if (credentialAccount.changes === 0) {
        db.prepare(
          `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
           VALUES (?, ?, 'credential', ?, ?, ?, ?)`
        ).run(randomUUID(), userId, userId, passwordHash, now, now);
      }
      db.prepare("DELETE FROM session WHERE userId = ?").run(userId);
      db.prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, 'admin_account.credentials_rotated', 'admin_user', ?, ?)`
      ).run(randomUUID(), userId, userId, JSON.stringify({ email }));
    } else {
      if (admins.length > 0) {
        throw new Error("An administrator was created while this command was running.");
      }
      db.prepare(
        `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role)
         VALUES (?, ?, ?, 1, ?, ?, 'admin')`
      ).run(userId, name, email, now, now);
      db.prepare(
        `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
         VALUES (?, ?, 'credential', ?, ?, ?, ?)`
      ).run(randomUUID(), userId, userId, passwordHash, now, now);
      db.prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, 'admin_account.created', 'admin_user', ?, ?)`
      ).run(randomUUID(), userId, userId, JSON.stringify({ email }));
    }
  });
  saveAdmin();

  console.log(`${existingAdmin ? "Updated" : "Created"} administrator credentials for ${email}.`);
}

main().catch((error: unknown) => {
  console.error("Administrator bootstrap failed.", error);
  process.exitCode = 1;
});
