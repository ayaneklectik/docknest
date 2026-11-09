import type { Metadata } from "next";
import Link from "next/link";
import { ServiceCards } from "@/components/service-cards";
import { HostingConfigurator } from "@/components/hosting-configurator";
import { listAddons, listProducts } from "@backend/catalog";
import { getSiteContent } from "@backend/site-content";
import { CatalogPriceList } from "@/components/catalog-price-list";

export const metadata: Metadata = {
  title: "Web Hosting",
  description: "Hosting shaped around your sites, workloads, and growth plans. Request a tailored Docknest quotation."
};

export const dynamic = "force-dynamic";

export default function HostingPage() {
  const products = listProducts("hosting");
  const addons = listAddons();
  const hosting = getSiteContent().pages.hosting;
  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="eyebrow"><span className="status-dot" /> {hosting.eyebrow}</p>
        <h1>{hosting.lineOne}<br />{hosting.lineTwo} <em>{hosting.accent}</em></h1>
        <p className="hero-lede">{hosting.description}</p>
        <Link className="button button-dark" href="/quote">Plan my hosting <span aria-hidden="true">↗</span></Link>
      </section>
      <section className="content-section">
        <div className="section-heading"><div><div className="section-kicker">{hosting.sectionKicker}</div><h2>{hosting.sectionTitle}</h2></div><p>{hosting.sectionDescription}</p></div>
        {products.length > 0 ? (
          <div className="catalog-plan-grid">
            {products.map((product, index) => (
              <article className={`plan-card hosting-plan-card hosting-plan-card-${index % 4}`} id={`product-${product.id}`} key={product.id}>
                <div className={`hosting-card-visual hosting-card-visual-${index % 4}`} aria-hidden="true">
                  <div className="hosting-visual-top"><span>DOCKNEST / INFRASTRUCTURE</span><i><b /></i></div>
                  {index % 4 === 0 && (
                    <div className="hosting-server-stack">
                      <div><i /><b>WEB / NODE</b><small>APPLICATION</small></div>
                      <div><i /><b>DATA / STORE</b><small>DATABASE</small></div>
                      <div><i /><b>BACKUP / PLAN</b><small>RECOVERY</small></div>
                    </div>
                  )}
                  {index % 4 === 1 && (
                    <div className="hosting-traffic">
                      <div><span>TRAFFIC / SAMPLE</span><b>Workload</b><small>Performance preview</small></div>
                      <div>{[28, 44, 35, 54, 43, 69, 57, 82, 70, 100, 79, 91].map((height, bar) => <i key={bar} style={{ height: `${height}%` }} />)}</div>
                    </div>
                  )}
                  {index % 4 === 2 && (
                    <div className="hosting-vps-rack"><div><i /><i /><i /><b>NODE 01 <span>●</span></b></div><div><i /><i /><i /><b>NODE 02 <span>●</span></b></div><div><i /><i /><i /><b>NODE 03 <span>●</span></b></div></div>
                  )}
                  {index % 4 === 3 && (
                    <div className="hosting-storefront"><div className="hosting-store-window"><span>YOUR STORE / DEMO</span><b>Everything<br />in its place.</b><i /></div><div className="hosting-store-stats"><span>ORDER FLOW <b>PREVIEW</b></span><span>PAYMENT <b>CHECKOUT</b></span></div></div>
                  )}
                  <span className="hosting-orbit hosting-orbit-one" /><span className="hosting-orbit hosting-orbit-two" />
                </div>
                <div className="plan-top"><span>{String(product.sort_order + 1).padStart(2, "0")}</span><span className="plan-dot" /></div>
                <span className="catalog-category-label">Hosting</span>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <CatalogPriceList
                  prices={product.prices}
                  startingPriceBdtMinor={product.starting_price_bdt_minor}
                  startingPriceUsdMinor={product.starting_price_usd_minor}
                  startingPricePeriod={product.starting_price_period}
                />
                <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              </article>
            ))}
          </div>
        ) : <ServiceCards prices={hosting.fallbackPlanPrices} />}
        <p className="pricing-note">{products.length > 0 ? "Configured prices are shown above. Plans without a listed price require a manual quotation." : "Plans are not configured yet; the cards above describe service categories only, not active purchasable plans."}</p>
      </section>
      <section className="content-section"><HostingConfigurator products={products} addons={addons} /></section>
      <section className="content-section split-content"><div><div className="section-kicker">Built around the details</div><h2>More than a server spec.</h2></div><div><p>Storage, expected traffic, websites, backups, security, and control-panel licensing all affect the right setup. We’ll discuss those needs before recommending options.</p><p>cPanel licenses, if requested, are quoted separately. Dockploy is an internal infrastructure tool, not a customer-facing control panel.</p><Link className="text-link" href="/quote">Configure a hosting request <span aria-hidden="true">↗</span></Link></div></section>
    </div>
  );
}
