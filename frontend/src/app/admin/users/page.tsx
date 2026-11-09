import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminUsersManager } from "@/components/admin-users-manager";
import { getAdminSession } from "@backend/admin-session";
import { listManagedUsers } from "@backend/admin-users";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "User accounts", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="page-shell admin-shell">
      <section className="admin-heading">
        <div><p className="eyebrow"><span className="status-dot" /> USER ACCESS</p><h1>Accounts,<br /><em>under control.</em></h1></div>
        <p>Create, update, and remove customer or administrator sign-in accounts. The last administrator and your current account are protected from deletion.</p>
      </section>
      <section className="admin-content">
        <AdminUsersManager initialUsers={listManagedUsers()} currentUserId={session.user.id} />
      </section>
    </div>
  );
}
