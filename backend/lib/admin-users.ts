import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { db, isBusinessDatabaseReady } from "@backend/db";

export const managedUserRoleSchema = z.enum(["admin", "customer"]);

export const managedUserInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(14).max(128),
  role: managedUserRoleSchema
});

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: number;
  createdAt: string;
};

function assertReady() {
  if (!isBusinessDatabaseReady()) {
    throw new Error("Run npm run db:migrate before managing accounts.");
  }
}

function recordAudit(actorId: string, action: string, userId: string, details: object) {
  db.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
     VALUES (?, ?, ?, 'auth_user', ?, ?)`
  ).run(randomUUID(), actorId, action, userId, JSON.stringify(details));
}

export function listManagedUsers(): ManagedUser[] {
  assertReady();
  return db.prepare(
    `SELECT id, name, email, role, emailVerified, createdAt
     FROM user ORDER BY email COLLATE NOCASE LIMIT 500`
  ).all() as ManagedUser[];
}

export async function createManagedUser(
  input: z.infer<typeof managedUserInputSchema>,
  actorId: string
): Promise<string> {
  assertReady();
  const userId = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  const email = input.email.trim().toLowerCase();
  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role)
       VALUES (?, ?, ?, 0, ?, ?, ?)`
    ).run(userId, input.name.trim(), email, now, now, input.role);
    db.prepare(
      `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
       VALUES (?, ?, 'credential', ?, ?, ?, ?)`
    ).run(randomUUID(), userId, userId, passwordHash, now, now);
    recordAudit(actorId, "auth_user.created", userId, { email, role: input.role });
  });
  create();
  return userId;
}

export function updateManagedUserRole(
  userId: string,
  role: z.infer<typeof managedUserRoleSchema>,
  actorId: string
): boolean {
  assertReady();
  const update = db.transaction(() => {
    const user = db.prepare("SELECT role FROM user WHERE id = ?").get(userId) as { role: string } | undefined;
    if (!user || userId === actorId) return false;
    if (user.role === "admin" && role !== "admin") {
      const count = db.prepare("SELECT COUNT(*) AS count FROM user WHERE role = 'admin'").get() as { count: number };
      if (count.count <= 1) throw new Error("The last administrator cannot be demoted.");
    }
    if (user.role !== role) {
      db.prepare("UPDATE user SET role = ?, updatedAt = ? WHERE id = ?").run(role, new Date().toISOString(), userId);
      db.prepare("DELETE FROM session WHERE userId = ?").run(userId);
      recordAudit(actorId, "auth_user.role_changed", userId, { from: user.role, to: role });
    }
    return true;
  });
  return update();
}

export function deleteManagedUser(userId: string, actorId: string): boolean {
  assertReady();
  const remove = db.transaction(() => {
    const user = db.prepare("SELECT role, email FROM user WHERE id = ?").get(userId) as
      { role: string; email: string } | undefined;
    if (!user || userId === actorId) return false;
    if (user.role === "admin") {
      const count = db.prepare("SELECT COUNT(*) AS count FROM user WHERE role = 'admin'").get() as { count: number };
      if (count.count <= 1) throw new Error("The last administrator cannot be deleted.");
    }
    db.prepare("DELETE FROM session WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM account WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM staff_assignments WHERE user_id = ?").run(userId);
    const deleted = db.prepare("DELETE FROM user WHERE id = ?").run(userId).changes === 1;
    if (deleted) recordAudit(actorId, "auth_user.deleted", userId, { email: user.email, role: user.role });
    return deleted;
  });
  return remove();
}

export async function resetManagedUserPassword(
  userId: string,
  password: string,
  actorId: string
): Promise<boolean> {
  assertReady();
  const passwordHash = await hashPassword(password);
  const reset = db.transaction(() => {
    const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId);
    if (!user) return false;
    const account = db.prepare(
      "UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'"
    ).run(passwordHash, new Date().toISOString(), userId);
    if (account.changes !== 1) throw new Error("This user does not have a password-based account.");
    db.prepare("DELETE FROM session WHERE userId = ?").run(userId);
    recordAudit(actorId, "auth_user.password_reset", userId, {});
    return true;
  });
  return reset();
}
