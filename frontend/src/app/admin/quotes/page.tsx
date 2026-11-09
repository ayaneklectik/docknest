import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminQuotesTable } from "@/components/admin-quotes-table";
import { getStaffSession } from "@backend/admin-session";
import { listQuoteRequests } from "@backend/quotes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quotations", robots: { index: false, follow: false } };

export default async function QuotesPage() {
  if (!await getStaffSession("quotes.manage")) redirect("/admin");
  const quotes = listQuoteRequests();
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">SALES · QUOTATION MANAGEMENT</p><h1>Every request,<br /><em>clearly priced.</em></h1></div><p>Save a formal quotation, record the customer&apos;s response, and convert only approved quotes into orders.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Quotation pipeline</div><h2>All requests <span>{quotes.length}</span></h2></div><AdminQuotesTable quotes={quotes} /></section>
  </div>;
}
