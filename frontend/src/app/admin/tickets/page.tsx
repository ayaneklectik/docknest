import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminTickets } from "@/components/admin-tickets";
import { getStaffSession } from "@backend/admin-session";
import { listSupportTickets } from "@backend/operations";
import { listAssignableStaff } from "@backend/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support tickets", robots: { index: false, follow: false } };

export default async function TicketsPage() {
  if (!await getStaffSession("support.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">CUSTOMER CARE · SUPPORT</p><h1>Support with<br /><em>context.</em></h1></div><p>Review incoming requests, set priority and owner, and keep public replies distinct from internal notes.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Support queue</div><h2>All tickets</h2></div><AdminTickets tickets={listSupportTickets()} staff={listAssignableStaff()} /></section>
  </div>;
}
