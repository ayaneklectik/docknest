import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@backend/admin-session";
import { getSalesAnalytics } from "@backend/sales";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales analytics", robots: { index: false, follow: false } };

export default async function AnalyticsPage() {
  if (!await getStaffSession("analytics.view")) redirect("/admin");
  const report = getSalesAnalytics();
  const metrics = [
    ["Customers", report.customers],
    ["Quotations", report.quotations],
    ["Orders", report.orders],
    ["Payments awaiting review", report.pending_payments],
    ["Open support tickets", report.open_tickets]
  ] as const;
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">REPORTING · CURRENT RECORDS</p><h1>Numbers with<br /><em>context.</em></h1></div><p>Approved manual payments are shown as recorded. This report does not imply gateway settlement or service activation.</p></section>
    <section className="admin-content">
      <div className="admin-section-heading"><div className="section-kicker">Current totals</div><h2>Business overview</h2></div>
      <div className="analytics-grid">{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value.toLocaleString()}</strong></article>)}</div>
      <div className="admin-section-heading analytics-revenue-heading"><div className="section-kicker">Manually approved payments</div><h2>Recorded revenue</h2></div>
      {report.revenue.length === 0 ? <p className="empty-state">No payments have been approved yet.</p> : <div className="analytics-grid analytics-revenue">{report.revenue.map((item) => <article key={item.currency}><span>{item.currency} · minor units</span><strong>{item.total_minor.toLocaleString()}</strong></article>)}</div>}
      <p className="pricing-note">Totals are lifetime records in the local database and are not date-filtered or reconciled against a payment provider.</p>
    </section>
  </div>;
}
