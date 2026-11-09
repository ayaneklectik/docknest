import type { Metadata } from "next";
import { QuoteForm } from "@/components/quote-form";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell Docknest what you are building. We will follow up with a tailored quotation or consultation."
};

const knownServices = [
  "Shared hosting", "Business hosting", "Managed VPS", "E-commerce hosting", "Custom hosting",
  "Website development", "Web application", "Custom software and API",
  "Website maintenance", "Domain registration", "General enquiry"
];

export default async function QuotePage({
  searchParams
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const initialService = knownServices.includes(service ?? "") ? service! : "Shared hosting";
  return (
    <div className="page-shell">
      <section className="page-hero compact-hero">
        <p className="eyebrow"><span className="status-dot" /> NO PRESSURE, JUST A GOOD CONVERSATION</p>
        <h1>Tell us what<br />you’re <em>imagining.</em></h1>
        <p className="hero-lede">Share a few details and our team will help clarify scope, options, and pricing. Submitting a request is not an order.</p>
      </section>
      <section className="content-section quote-section">
        <div className="quote-intro"><div className="section-kicker">A good place to start</div><h2>What would you like to make possible?</h2><p>We’ll keep your details private and use them only to respond to this request.</p><a href="mailto:hello@docknest.com">Prefer email? hello@docknest.com</a></div>
        <QuoteForm initialService={initialService} />
      </section>
    </div>
  );
}
