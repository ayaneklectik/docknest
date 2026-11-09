import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="page-shell legal-page">
      <section className="page-hero compact-hero"><p className="eyebrow">LEGAL · NOT A CONTRACT</p><h1>Terms of <em>service.</em></h1><p className="hero-lede">This page is a pre-launch placeholder, not enforceable or complete terms. A qualified legal professional must review and replace it before any sale.</p></section>
      <section className="content-section legal-copy">
        <h2>Quotes and orders</h2><p>Submitting a request on this site is an enquiry only. It is not an offer, order, or promise of service. Final scope, price, taxes, payment terms, and delivery commitments must be stated in an accepted written quotation.</p>
        <h2>Services and availability</h2><p>No hosting service, domain, software project, support level, or infrastructure is activated by a request or by payment approval in this development build. Availability and service levels are not represented here.</p>
        <h2>Provider and legal details</h2><p>Docknest is an emerging business and is not yet formally registered. The contracting legal entity, governing law, liability terms, acceptable-use policy, data processing terms, and dispute process must be established before launch.</p>
        <p className="pricing-note">Do not use this draft as customer terms. Legal review is mandatory.</p>
      </section>
    </div>
  );
}
