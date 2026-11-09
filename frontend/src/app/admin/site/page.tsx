import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSiteEditor } from "@/components/admin-site-editor";
import { getAdminSession } from "@backend/admin-session";
import { getSiteContent } from "@backend/site-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Website control", robots: { index: false, follow: false } };

export default async function AdminSitePage() {
  if (!await getAdminSession()) redirect("/admin/login");
  return (
    <div className="page-shell admin-shell">
      <section className="admin-heading">
        <div><p className="eyebrow"><span className="status-dot" /> WEBSITE CONTROL</p><h1>Your site,<br /><em>your call.</em></h1></div>
        <div className="admin-heading-actions">
          <p>Update public page copy, navigation, service listings, and images here. Changes publish when you save.</p>
          <a className="text-link" href="/" target="_blank" rel="noreferrer">View public site <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <nav className="admin-quick-links" aria-label="Site management shortcuts">
        <a href="/admin/products">Services & pricing <span>↗</span></a>
        <a href="/admin/content">Blog & knowledge base <span>↗</span></a>
        <a href="/admin">Business control center <span>↗</span></a>
      </nav>
      <section className="admin-content"><AdminSiteEditor initialContent={getSiteContent()} /></section>
    </div>
  );
}
