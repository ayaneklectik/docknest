import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Level Information",
  description: "Docknest has not published contractual uptime, support-response, or service-credit commitments."
};

export default function ServiceLevelPage() {
  return <div className="page-shell legal-page">
    <section className="page-hero compact-hero"><p className="eyebrow">SERVICE LEVEL INFORMATION</p><h1>Clear expectations,<br /><em>without guesswork.</em></h1><p className="hero-lede">No contractual service-level agreement is currently published.</p></section>
    <section className="content-section legal-copy">
      <div className="notice-box"><strong>Important</strong><p>This page is informational and is not a service-level agreement. Docknest has not approved uptime percentages, support response or resolution targets, maintenance windows, service credits, or incident severity commitments.</p></div>
      <h2>Support requests</h2>
      <p>Support requests can be submitted through the support page and are recorded for team review. Outbound email delivery is not configured by default. Submitting a request does not create a guaranteed response time or 24/7 support commitment.</p>
      <h2>Hosting and availability</h2>
      <p>The public site does not currently represent that paid hosting is available or provisioned. No uptime measurement, monitoring commitment, or service credit is offered by this page.</p>
      <h2>Future commitments</h2>
      <p>Any binding service levels must be separately approved, published with their scope and exclusions, and incorporated into applicable customer terms before they are offered.</p>
    </section>
  </div>;
}
