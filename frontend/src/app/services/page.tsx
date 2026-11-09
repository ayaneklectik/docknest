import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@backend/site-content";
import { listProducts } from "@backend/catalog";
import { CatalogProductsSection } from "@/components/catalog-products-section";

export const metadata: Metadata = {
  title: "Web and Software Development",
  description: "Custom websites, web applications, e-commerce, and API development—without WordPress development."
};

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  const services = getSiteContent().pages.services;
  const catalogProducts = [
    ...listProducts("development"),
    ...listProducts("maintenance")
  ].sort((left, right) => left.sort_order - right.sort_order || left.name.localeCompare(right.name));
  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="eyebrow"><span className="status-dot" /> {services.eyebrow}</p>
        <h1>{services.lineOne}<br /><em>{services.accent}</em></h1>
        <p className="hero-lede">{services.description}</p>
        <Link className="button button-dark" href="/quote?service=Website%20development">Talk about your project <span aria-hidden="true">↗</span></Link>
      </section>
      <section className="content-section development-section">
        <div className="section-heading">
          <div><div className="section-kicker">From first sketch to launch</div><h2>Built for the way<br />you <em>work.</em></h2></div>
          <p>Websites, products, and integrations made around your actual idea—not a theme that almost fits.</p>
        </div>
        <div className="development-grid">
          {services.offerings.map(({ title, description, quoteService }, index) => (
            <article className={`development-card development-card-${index % 4}`} key={title}>
              <div className="development-card-visual">
                <div className="development-card-meta"><span>{String(index + 1).padStart(2, "0")} / {String(services.offerings.length).padStart(2, "0")}</span><span className="development-live">CONCEPT PREVIEW</span></div>
                {index % 4 === 0 && (
                  <div className="dev-browser">
                    <div className="dev-browser-bar"><i /><i /><i /><span>project / preview</span></div>
                    <div className="dev-browser-content"><div><b>Make room<br />for what’s next.</b><i /><i /></div><div className="dev-browser-art"><span>d.</span></div></div>
                  </div>
                )}
                {index % 4 === 1 && (
                  <div className="dev-phone"><div className="dev-phone-camera" /><span className="dev-phone-kicker">YOUR NEXT MOVE</span><b>Everything<br />in one place.</b><i /><i /><span className="dev-phone-cta">Get started <b>↗</b></span></div>
                )}
                {index % 4 === 2 && (
                  <div className="dev-dashboard">
                    <div className="dev-dashboard-head"><span>SAMPLE DATA</span><b>PREVIEW</b></div>
                    <div className="dev-chart">{[28, 42, 34, 65, 50, 78, 58, 91, 73, 100, 82, 94].map((height, bar) => <i key={bar} style={{ height: `${height}%` }} />)}</div>
                    <div className="dev-dashboard-foot"><span>ANALYTICS VIEW</span><b>Illustrative</b></div>
                  </div>
                )}
                {index % 4 === 3 && (
                  <div className="dev-terminal">
                    <div><i /><i /><i /><span>api / response</span></div>
                    <code><span>GET</span> /v1/projects</code>
                    <code className="dev-terminal-muted">200 OK · 42ms</code>
                    <code>{"{"}</code>
                    <code>&nbsp; &quot;status&quot;: <b>&quot;ready&quot;</b>,</code>
                    <code>&nbsp; &quot;built_for&quot;: <b>&quot;you&quot;</b></code>
                    <code>{"}"}</code>
                  </div>
                )}
              </div>
              <div className="development-card-copy">
                <div><span className="development-card-label">{["DIGITAL PRESENCE", "PRODUCT EXPERIENCE", "COMMERCE & DATA", "CONNECTED SYSTEMS"][index % 4]}</span><h3>{title}</h3></div>
                <p>{description}</p>
                <Link href={`/quote?service=${encodeURIComponent(quoteService)}`} aria-label={`Request a quote for ${title}`}>Talk through your idea <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
        <CatalogProductsSection
          products={catalogProducts}
          title="Development & maintenance plans"
          description="Configured services and prices appear here. Select a service to ask Docknest about it."
        />
        <div className="development-stack">
          <span className="development-stack-label">TOOLS WE BUILD WITH</span>
          <div className="development-stack-items" aria-label="Technology stack">
            <span><i className="stack-mark stack-mark-ts">TS</i>TypeScript</span>
            <span><i className="stack-mark stack-mark-react"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="3.8" /><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.5" /></svg></i>React</span>
            <span><i className="stack-mark stack-mark-node">N</i>Node.js</span>
            <span><i className="stack-mark stack-mark-py">Py</i>Python</span>
            <span><i className="stack-mark stack-mark-php">PHP</i>PHP</span>
            <span><i className="stack-mark stack-mark-db">PG</i>PostgreSQL</span>
          </div>
        </div>
        <p className="pricing-note">{services.note}</p>
      </section>
    </div>
  );
}
