import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminQuotesTable } from "@/components/admin-quotes-table";
import { getSignedInStaffSession } from "@backend/admin-session";
import { adminNavigationGroups } from "@/lib/admin-navigation";
import { listQuoteRequests } from "@backend/quotes";
import { getSalesAnalytics } from "@backend/sales";
import { getStaffPermissions, type StaffPermission } from "@backend/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin overview", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await getSignedInStaffSession();
  if (!session) redirect("/admin/login");
  const permissions = getStaffPermissions(session.user.id);
  const isAdministrator = session.user.role === "admin";
  const canAccess = (permission: StaffPermission | "administrator") =>
    isAdministrator || (permission !== "administrator" && permissions.includes(permission));
  const canManageQuotes = canAccess("quotes.manage");
  const quotes = canManageQuotes ? listQuoteRequests() : [];
  const report = getSalesAnalytics();
  const metrics = [
    ["Customers", report.customers, "/admin/customers"],
    ["Quotations", report.quotations, "/admin/quotes"],
    ["Orders", report.orders, "/admin/orders"],
    ["Payments to review", report.pending_payments, "/admin/payments"],
    ["Open support", report.open_tickets, "/admin/tickets"]
  ] as const;

  return (
    <div className="page-shell admin-shell">
      <section className="admin-heading">
        <div><p className="eyebrow"><span className="status-dot" /> DOCKNEST CONTROL CENTER</p><h1>Welcome back,<br /><em>{session.user.name}.</em></h1></div>
        <div className="admin-heading-actions"><p>One place to run your business and keep your public website up to date.</p></div>
      </section>
      <section className="admin-control-overview">
        <Link href="/admin/site"><span>01 · PUBLIC WEBSITE</span><strong>Edit pages, images, and navigation</strong><small>Homepage, about, services, brand and footer</small><b aria-hidden="true">↗</b></Link>
        <Link href="/admin/products"><span>02 · OFFERINGS</span><strong>Manage services and pricing</strong><small>Choose what is published; configure quote pricing</small><b aria-hidden="true">↗</b></Link>
        <Link href="/admin/content"><span>03 · PUBLISHING</span><strong>Write and publish articles</strong><small>Manage blog posts and knowledge-base guides</small><b aria-hidden="true">↗</b></Link>
      </section>
      <section className="admin-content admin-overview-content">
        <div className="admin-section-heading"><div><div className="section-kicker">Live records</div><h2>At a glance</h2></div><Link className="text-link" href="/admin/analytics">View analytics <span aria-hidden="true">↗</span></Link></div>
        <div className="admin-metrics">
          {metrics.map(([label, value, href], index) => (
            <Link href={href} className="admin-metric-card" key={label}>
              <span className="admin-metric-code">0{index + 1} / CURRENT</span>
              <small>{label}</small>
              <strong>{value.toLocaleString()}</strong>
              <i aria-hidden="true">↗</i>
            </Link>
          ))}
        </div>
      </section>
      <nav className="admin-module-directory" aria-label="Business administration modules">
        {adminNavigationGroups.map((group) => {
          const items = group.items.filter((item) =>
            item.permission === null || canAccess(item.permission)
          );
          if (items.length === 0) return null;
          return (
            <section className="admin-module-group" key={group.label}>
              <div className="section-kicker">{group.label}</div>
              <div className="admin-quick-links">
                {items.map((item) => <Link href={item.href} key={item.href}><span>{item.code}</span>{item.label}<b aria-hidden="true">↗</b></Link>)}
              </div>
            </section>
          );
        })}
      </nav>
      {canManageQuotes
        ? <section className="admin-content"><div className="admin-section-heading"><div><div className="section-kicker">Sales workflow</div><h2>Quotation requests <span>{quotes.length}</span></h2></div></div><AdminQuotesTable quotes={quotes} /></section>
        : <section className="admin-content"><p className="empty-state">Your account is signed in, but no Docknest modules are assigned. Ask an administrator to grant the required role.</p></section>}
      <div className="admin-disclaimer"><strong>Manual business workflows</strong><p>Payment approval updates order and invoice records only; no service is activated or provisioned.</p></div>
    </div>
  );
}
