import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <div className="page-shell legal-page">
      <section className="page-hero compact-hero"><p className="eyebrow">LEGAL · DRAFT FOR REVIEW</p><h1>Privacy <em>notice.</em></h1><p className="hero-lede">This draft explains the limited data this development build collects. It is not legal advice and must be reviewed before launch.</p></section>
      <section className="content-section legal-copy">
        <h2>Information submitted</h2><p>When you request a quotation, this application stores your name, email, optional company, selected service, billing preference, and project requirements in its local database so Docknest can respond.</p>
        <h2>Use and sharing</h2><p>The data is intended only for responding to your enquiry. This build does not integrate analytics, an email provider, a registrar, or a payment gateway. The operator must secure database access and backups.</p>
        <h2>Retention and your choices</h2><p>Retention periods, data-subject request handling, contact details for privacy requests, international-transfer terms, and applicable Bangladesh and international legal requirements have not yet been approved. Do not submit sensitive personal, payment, or credential information.</p>
        <h2>Contact</h2><p>For a privacy question, use the contact page. Confirm the operating entity and legal contact before publishing this notice.</p>
        <p className="pricing-note">Draft status: 8 November 2026. Legal review required before production use.</p>
      </section>
    </div>
  );
}
