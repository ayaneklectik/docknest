"use client";

import { useState, type FormEvent } from "react";
import type { ManagedUser } from "@backend/admin-users";

type Props = {
  initialUsers: ManagedUser[];
  currentUserId: string;
};

type Role = "admin" | "customer";

async function readResponse(response: Response): Promise<{ error?: string; id?: string }> {
  return response.json() as Promise<{ error?: string; id?: string }>;
}

export function AdminUsersManager({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshUsers() {
    const response = await fetch("/api/admin/users");
    const result = await readResponse(response) as { users?: ManagedUser[]; error?: string };
    if (!response.ok || !result.users) {
      throw new Error(result.error ?? "User accounts could not be loaded.");
    }
    setUsers(result.users);
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error ?? "User account could not be created.");
      setName("");
      setEmail("");
      setPassword("");
      await refreshUsers();
      setNotice("User account created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "User account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(user: ManagedUser) {
    const nextRole = roles[user.id];
    if (!nextRole || nextRole === user.role) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error ?? "User role could not be changed.");
      await refreshUsers();
      setRoles({});
      setNotice("User role updated. Their active sessions were signed out.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "User role could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>, user: ManagedUser) {
    event.preventDefault();
    const nextPassword = resetPasswords[user.id] ?? "";
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nextPassword })
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error ?? "User password could not be reset.");
      setResetPasswords((current) => ({ ...current, [user.id]: "" }));
      setNotice(`Password reset for ${user.email}. Their active sessions were signed out.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "User password could not be reset.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: ManagedUser) {
    if (!window.confirm(`Permanently delete the sign-in account for ${user.email}?`)) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error ?? "User account could not be deleted.");
      await refreshUsers();
      setNotice(`User account ${user.email} deleted.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "User account could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-users-manager">
      <section className="admin-user-create">
        <div className="admin-section-heading">
          <div className="section-kicker">Create an account</div>
          <h2>New user</h2>
        </div>
        <form className="admin-user-form" onSubmit={(event) => void createUser(event)}>
          <label>Name<input autoComplete="name" maxLength={100} onChange={(event) => setName(event.target.value)} required value={name} /></label>
          <label>Email<input autoComplete="email" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Temporary password<input autoComplete="new-password" minLength={14} maxLength={128} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /><small>At least 14 characters. The password is hashed before it reaches the database.</small></label>
          <label>Account role<select onChange={(event) => setRole(event.target.value as Role)} value={role}><option value="customer">Customer</option><option value="admin">Administrator</option></select></label>
          <button className="button button-light" disabled={busy} type="submit">{busy ? "Working…" : "Create user"}</button>
        </form>
      </section>

      <section className="admin-user-list">
        <div className="admin-section-heading">
          <div><div className="section-kicker">SQLite authentication accounts</div><h2>Users <span>{users.length}</span></h2></div>
          <p>Passwords are stored as hashes. Role changes and password resets revoke existing sessions.</p>
        </div>
        {users.length === 0
          ? <p className="empty-state">No user accounts found.</p>
          : <div className="admin-user-table-wrap"><table className="admin-user-table">
            <thead><tr><th>User</th><th>Role</th><th>Created</th><th>Manage account</th></tr></thead>
            <tbody>{users.map((user) => {
              const selectedRole = roles[user.id] ?? (user.role === "admin" ? "admin" : "customer");
              const isCurrentUser = user.id === currentUserId;
              return <tr key={user.id}>
                <td><strong>{user.name}</strong><span>{user.email}</span>{isCurrentUser && <small>Current account</small>}</td>
                <td>
                  <select aria-label={`Role for ${user.email}`} disabled={busy || isCurrentUser} onChange={(event) => setRoles((current) => ({ ...current, [user.id]: event.target.value as Role }))} value={selectedRole}>
                    {user.role !== "admin" && user.role !== "customer" && <option value={user.role}>{user.role} (legacy)</option>}
                    <option value="customer">Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {selectedRole !== user.role && !isCurrentUser && <button className="small-action" disabled={busy} onClick={() => void changeRole(user)} type="button">Save role</button>}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="admin-user-actions">
                  <form onSubmit={(event) => void resetPassword(event, user)}>
                    <input aria-label={`New password for ${user.email}`} autoComplete="new-password" minLength={14} maxLength={128} onChange={(event) => setResetPasswords((current) => ({ ...current, [user.id]: event.target.value }))} placeholder="New password (14+ chars)" required type="password" value={resetPasswords[user.id] ?? ""} />
                    <button className="small-action" disabled={busy} type="submit">Reset password</button>
                  </form>
                  {!isCurrentUser && <button className="small-action admin-user-delete" disabled={busy} onClick={() => void deleteUser(user)} type="button">Delete user</button>}
                </td>
              </tr>;
            })}</tbody>
          </table></div>}
      </section>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
    </div>
  );
}
