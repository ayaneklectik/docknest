import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";
import type { StaffPermission, StaffRole, StaffUser } from "@/lib/staff-types";

export { staffPermissions } from "@/lib/staff-types";
export type { StaffPermission, StaffRole, StaffUser } from "@/lib/staff-types";

function assertReady() {
  if (!isBusinessDatabaseReady()) throw new Error("Run npm run db:migrate before managing staff.");
}

export function hasStaffPermission(userId: string, permission: StaffPermission): boolean {
  assertReady();
  return Boolean(db.prepare(
    `SELECT 1 FROM staff_assignments a
     JOIN staff_permissions p ON p.role_id = a.role_id
     WHERE a.user_id = ? AND p.permission = ? LIMIT 1`
  ).get(userId, permission));
}

export function getStaffPermissions(userId: string): StaffPermission[] {
  assertReady();
  return (db.prepare(
    `SELECT DISTINCT p.permission FROM staff_assignments a
     JOIN staff_permissions p ON p.role_id = a.role_id
     WHERE a.user_id = ? ORDER BY p.permission`
  ).all(userId) as Array<{ permission: StaffPermission }>).map((row) => row.permission);
}

export function listStaffRoles(): StaffRole[] {
  assertReady();
  const roles = db.prepare("SELECT id, name, description FROM staff_roles ORDER BY name").all() as Array<Omit<StaffRole, "permissions">>;
  const getPermissions = db.prepare("SELECT permission FROM staff_permissions WHERE role_id = ? ORDER BY permission");
  return roles.map((role) => ({
    ...role,
    permissions: (getPermissions.all(role.id) as Array<{ permission: StaffPermission }>).map((row) => row.permission)
  }));
}

export function listStaffUsers(): StaffUser[] {
  assertReady();
  const users = db.prepare(
    `SELECT u.id, u.name, u.email FROM user u
     WHERE u.role != 'admin'
     ORDER BY u.email LIMIT 500`
  ).all() as Array<{ id: string; name: string; email: string }>;
  const getRoles = db.prepare(
    `SELECT r.name FROM staff_assignments a
     JOIN staff_roles r ON r.id = a.role_id WHERE a.user_id = ? ORDER BY r.name`
  );
  return users.map((user) => ({
    ...user,
    roles: (getRoles.all(user.id) as Array<{ name: string }>).map((row) => row.name)
  }));
}

export function listAssignableStaff(): StaffUser[] {
  assertReady();
  const users = db.prepare(
    `SELECT u.id, u.name, u.email FROM user u
     WHERE u.role = 'admin' OR EXISTS (
       SELECT 1 FROM staff_assignments a WHERE a.user_id = u.id
     )
     ORDER BY u.email LIMIT 500`
  ).all() as Array<{ id: string; name: string; email: string }>;
  const getRoles = db.prepare(
    `SELECT r.name FROM staff_assignments a
     JOIN staff_roles r ON r.id = a.role_id WHERE a.user_id = ? ORDER BY r.name`
  );
  return users.map((user) => ({
    ...user,
    roles: (getRoles.all(user.id) as Array<{ name: string }>).map((row) => row.name)
  }));
}

export function saveStaffRole(
  input: { name: string; description: string; permissions: StaffPermission[] },
  actorId: string,
  roleId?: string
): string {
  assertReady();
  if (input.name === "admin") throw new Error("The built-in administrator role cannot be edited.");
  const targetId = roleId ?? randomUUID();
  const save = db.transaction(() => {
    const existing = db.prepare("SELECT id, name FROM staff_roles WHERE id = ?").get(targetId) as { id: string; name: string } | undefined;
    if (roleId && !existing) throw new Error("Staff role not found.");
    if (existing?.name === "admin") throw new Error("The built-in administrator role cannot be edited.");
    if (existing) {
      db.prepare("UPDATE staff_roles SET name = ?, description = ? WHERE id = ?")
        .run(input.name, input.description, targetId);
    } else {
      db.prepare("INSERT INTO staff_roles (id, name, description) VALUES (?, ?, ?)")
        .run(targetId, input.name, input.description);
    }
    db.prepare("DELETE FROM staff_permissions WHERE role_id = ?").run(targetId);
    const insert = db.prepare("INSERT INTO staff_permissions (role_id, permission) VALUES (?, ?)");
    for (const permission of input.permissions) insert.run(targetId, permission);
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'staff_role.saved', 'staff_role', ?, ?)`
    ).run(randomUUID(), actorId, targetId, JSON.stringify({ name: input.name, permissions: input.permissions }));
    return targetId;
  });
  return save();
}

export function assignStaffRoles(userId: string, roleIds: string[], actorId: string): boolean {
  assertReady();
  const assign = db.transaction(() => {
    const user = db.prepare("SELECT role FROM user WHERE id = ?").get(userId) as { role: string } | undefined;
    if (!user || user.role === "admin") return false;
    db.prepare("DELETE FROM staff_assignments WHERE user_id = ?").run(userId);
    const insert = db.prepare("INSERT INTO staff_assignments (user_id, role_id) VALUES (?, ?)");
    for (const roleId of [...new Set(roleIds)]) {
      const role = db.prepare("SELECT name FROM staff_roles WHERE id = ?").get(roleId) as { name: string } | undefined;
      if (!role || role.name === "admin") throw new Error("Choose valid non-administrator staff roles.");
      insert.run(userId, roleId);
    }
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'staff_roles.assigned', 'staff_user', ?, ?)`
    ).run(randomUUID(), actorId, userId, JSON.stringify({ roleIds }));
    return true;
  });
  return assign();
}
