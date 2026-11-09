import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <div className="page-shell legal-page">
      <section className="page-hero compact-hero"><p className="eyebrow">LEGAL · NOT YET ESTABLISHED</p><h1>Refund <em>policy.</em></h1><p className="hero-lede">No refund terms have been established. This page is intentionally clear rather than inventing a commercial policy.</p></section>
      <section className="content-section legal-copy"><h2>Before purchase</h2><p>This platform does not currently accept payments or activate services. Any future refund, cancellation, renewal, and domain-registration terms must be published before checkout is enabled.</p><h2>Questions</h2><p>For a pre-sales question, use the contact page. Do not make a payment based on this development build.</p></section>
    </div>
  );
}
