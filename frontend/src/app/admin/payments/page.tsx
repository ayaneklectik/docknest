import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPayments } from "@/components/admin-orders";
import { getStaffSession } from "@backend/admin-session";
import { listPayments } from "@backend/sales";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment verification", robots: { index: false, follow: false } };

export default async function PaymentsPage() {
  if (!await getStaffSession("payments.review")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">FINANCE · MANUAL REVIEW</p><h1>Review the<br /><em>evidence.</em></h1></div><p>No gateway is connected. Customer-submitted references require a human review.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Payment submissions</div><h2>Manual verification queue</h2></div><AdminPayments payments={listPayments()} /></section>
  </div>;
}
