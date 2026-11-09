import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminOrders } from "@/components/admin-orders";
import { getStaffSession } from "@backend/admin-session";
import { listOrders } from "@backend/sales";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  if (!await getStaffSession("orders.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">SALES · ORDER MANAGEMENT</p><h1>Orders, with<br /><em>clear next steps.</em></h1></div><p>Orders begin only when a Docknest administrator converts an approved, priced quotation.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Order records</div><h2>All orders</h2></div><AdminOrders orders={listOrders()} /></section>
  </div>;
}
