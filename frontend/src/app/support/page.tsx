import type { Metadata } from "next";
import Link from "next/link";
import { SupportTicketForm } from "@/components/support-ticket-form";

export const metadata: Metadata = {
  title: "Support",
  description: "Submit a Docknest support request. Tickets are recorded for manual team follow-up."
};

export default function SupportPage() {
  return (
    <div className="page-shell">
      <section className="page-hero compact-hero"><p className="eyebrow"><span className="status-dot" /> HERE WHEN YOU NEED US</p><h1>Support that<br />starts with <em>listening.</em></h1><p className="hero-lede">Send the team a clear, safe description of what you need. Requests are recorded; email delivery is not yet configured.</p><Link className="text-link" href="/knowledge-base">Browse help articles ↗</Link></section>
      <section className="content-section support-ticket-section">
        <div className="quote-intro"><div className="section-kicker">Create a support ticket</div><h2>Tell us what’s going on.</h2><p>Never include passwords, payment credentials, or API keys. Do not rely on an SLA or response-time commitment; none has been confirmed.</p></div>
        <SupportTicketForm />
      </section>
    </div>
  );
}
