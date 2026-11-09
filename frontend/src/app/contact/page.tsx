import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@backend/site-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Docknest about hosting, digital projects, or support."
};

export default function ContactPage() {
  const { brand } = getSiteContent();
  return (
    <div className="page-shell">
      <section className="page-hero compact-hero">
        <p className="eyebrow"><span className="status-dot" /> A REAL PERSON, ON THE OTHER SIDE</p>
        <h1>Good things start<br />with a <em>hello.</em></h1>
        <p className="hero-lede">Tell us what you need, where you’re based, and what you’re hoping to build. We’ll point you in the right direction.</p>
      </section>
      <section className="content-section contact-grid">
        <article><span className="section-kicker">01 — New projects</span><h2>Plan what’s next.</h2><p>For hosting, development, and custom requirements, start with a quote request.</p><Link className="text-link" href="/quote">Request a quote ↗</Link></article>
        <article><span className="section-kicker">02 — General enquiries</span><h2>Tell us what’s on your mind.</h2><p>Use the general enquiry form to send a message to the Docknest team.</p><Link className="text-link" href="/quote?service=General%20enquiry">Send an enquiry ↗</Link><span className="muted-copy">Email delivery is not automated by this application.</span></article>
        <article><span className="section-kicker">03 — Support</span><h2>Need a hand?</h2><p>Support channels and ticketing are being prepared. For now, email the team with your request.</p><Link className="text-link" href="/support">Support information ↗</Link></article>
      </section>
      <section className="content-section contact-details">
        <div><span className="section-kicker">Get in touch</span><h2>We’re here to help.</h2></div>
        <div>
          <p>{brand.location}</p>
          {brand.email && <p><a href={`mailto:${brand.email}`}>{brand.email}</a></p>}
          {brand.phone && <p><a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}>{brand.phone}</a></p>}
        </div>
      </section>
    </div>
  );
}
