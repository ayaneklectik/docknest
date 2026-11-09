import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("admin user management stores hashes, revokes sessions, and binds user values", async () => {
  const directory = mkdtempSync(join(tmpdir(), "docknest-users-test-"));
  process.env.DATABASE_PATH = join(directory, "test.db");
  let database: Awaited<typeof import("../lib/db")>["db"] | undefined;

  try {
    const [{ db }, { auth }, { getMigrations }, { hashPassword, verifyPassword }] = await Promise.all([
      import("../lib/db"),
      import("../lib/auth"),
      import("better-auth/db/migration"),
      import("better-auth/crypto")
    ]);
    database = db;
    db.exec(`
      CREATE TABLE schema_migrations (
        name TEXT PRIMARY KEY NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    for (const migration of readdirSync(resolve("database/migrations")).filter((name) => name.endsWith(".sql")).sort()) {
      db.exec(readFileSync(resolve("database/migrations", migration), "utf8"));
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(migration);
    }
    const migrations = await getMigrations(auth.options);
    await migrations.runMigrations();

    const adminId = "73bf2faf-b927-4af7-9636-6b28f67f6728";
    const adminPassword = "Initial-Admin-Password-12345";
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role)
       VALUES (?, ?, ?, 1, ?, ?, 'admin')`
    ).run(adminId, "Test Administrator", "admin@example.test", now, now);
    db.prepare(
      `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
       VALUES (?, ?, 'credential', ?, ?, ?, ?)`
    ).run("admin-account", adminId, adminId, await hashPassword(adminPassword), now, now);

    const {
      createManagedUser,
      deleteManagedUser,
      listManagedUsers,
      managedUserInputSchema,
      resetManagedUserPassword,
      updateManagedUserRole
    } = await import("../lib/admin-users");
    const injectionLikeName = "Owner'); DROP TABLE user;--";
    const input = managedUserInputSchema.parse({
      name: injectionLikeName,
      email: "customer@example.test",
      password: "Initial-Customer-Password-12345",
      role: "customer"
    });
    const customerId = await createManagedUser(input, adminId);
    assert.equal(listManagedUsers().find((user) => user.id === customerId)?.name, injectionLikeName);
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS count FROM user").get() as { count: number }).count,
      2
    );
    assert.equal(
      managedUserInputSchema.safeParse({ ...input, role: "admin' OR 1=1 --" }).success,
      false
    );
    assert.equal(managedUserInputSchema.safeParse({ ...input, password: "short" }).success, false);
    assert.equal(updateManagedUserRole(adminId, "customer", adminId), false);
    assert.equal(deleteManagedUser(adminId, adminId), false);

    db.prepare("INSERT INTO session (id, token, userId, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)")
      .run("customer-session", "customer-token", customerId, now, now, now);
    assert.equal(await resetManagedUserPassword(customerId, "Changed-Customer-Password-54321", adminId), true);
    const storedHash = (db.prepare(
      "SELECT password FROM account WHERE userId = ? AND providerId = 'credential'"
    ).get(customerId) as { password: string }).password;
    assert.notEqual(storedHash, "Changed-Customer-Password-54321");
    assert.equal(await verifyPassword({ hash: storedHash, password: "Changed-Customer-Password-54321" }), true);
    assert.equal((db.prepare("SELECT COUNT(*) AS count FROM session WHERE userId = ?").get(customerId) as { count: number }).count, 0);

    assert.equal(updateManagedUserRole(customerId, "admin", adminId), true);
    assert.equal((db.prepare("SELECT role FROM user WHERE id = ?").get(customerId) as { role: string }).role, "admin");
    assert.equal(deleteManagedUser(customerId, adminId), true);
    assert.throws(() => deleteManagedUser(adminId, "another-admin"), /last administrator cannot be deleted/i);
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'user'").get() as { count: number }).count,
      1
    );
  } finally {
    database?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
