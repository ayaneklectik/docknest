import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getSignedInStaffSession } from "@backend/admin-session";

export const metadata: Metadata = { title: "Administrator sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getSignedInStaffSession()) redirect("/admin");
  return (
    <div className="page-shell admin-login-shell">
      <section className="page-hero compact-hero">
        <p className="eyebrow"><span className="status-dot" /> DOCKNEST ADMIN</p>
        <h1>Welcome <em>back.</em></h1>
        <p className="hero-lede">Private administrator sign-in. Account creation is controlled from the admin dashboard.</p>
      </section>
      <section className="content-section"><div className="admin-login-card"><AdminLoginForm /><p className="pricing-note">Public account registration is disabled. User accounts and password hashes are stored in the application’s SQLite database.</p></div></section>
    </div>
  );
}
