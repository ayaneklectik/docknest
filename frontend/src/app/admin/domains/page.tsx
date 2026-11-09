import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDomains } from "@/components/admin-domains";
import { getStaffSession } from "@backend/admin-session";
import { listDomainRequests } from "@backend/domains";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Domain requests", robots: { index: false, follow: false } };

export default async function DomainsAdminPage() {
  if (!await getStaffSession("domains.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">DOMAINS · MANUAL REGISTRAR WORKFLOW</p><h1>Check names,<br /><em>without guessing.</em></h1></div><p>Domain requests are recorded for a manual check. There is no live registrar integration or automated registration.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Manual requests</div><h2>Domain queue</h2></div><AdminDomains requests={listDomainRequests()} /></section>
  </div>;
}
