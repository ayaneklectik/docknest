import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminInvoices } from "@/components/admin-orders";
import { getStaffSession } from "@backend/admin-session";
import { listInvoices } from "@backend/sales";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoices", robots: { index: false, follow: false } };

export default async function InvoicesPage() {
  if (!await getStaffSession("invoices.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">FINANCE · INVOICES</p><h1>Keep the<br /><em>paperwork clear.</em></h1></div><p>Invoices are generated from saved quotations when orders are created. Unpaid invoices can be voided.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Invoice records</div><h2>All invoices</h2></div><AdminInvoices invoices={listInvoices()} /></section>
  </div>;
}
