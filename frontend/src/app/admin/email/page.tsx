import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminEmail } from "@/components/admin-email";
import { getStaffSession } from "@backend/admin-session";
import { isSmtpConfigured, listEmailOutbox } from "@backend/email";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email outbox", robots: { index: false, follow: false } };

export default async function EmailPage() {
  if (!await getStaffSession("email.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">NOTIFICATIONS · SMTP OUTBOX</p><h1>Messages you<br /><em>can verify.</em></h1></div><p>Email notifications are durable queue entries. No message is sent until SMTP is configured and delivery is explicitly dispatched.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Delivery operations</div><h2>Outbox</h2></div><AdminEmail messages={listEmailOutbox()} smtpConfigured={isSmtpConfigured()} /></section>
  </div>;
}
