import Link from "next/link";
import { HomeShowcase } from "@/components/home-showcase";
import { HeroDashboard } from "@/components/hero-dashboard";
import { listPublishedArticles } from "@backend/content";
import { getSiteContent } from "@backend/site-content";
import { listProducts } from "@backend/catalog";
import { CatalogPriceList } from "@/components/catalog-price-list";
import { productCategoryDetails } from "@/lib/catalog-types";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { home } = getSiteContent();
  const products = listProducts();
  const articles = listPublishedArticles("blog").slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> {home.heroEyebrow}</p>
            <h1>{home.heroLineOne}<br />{home.heroLineTwo} <em>{home.heroAccent}</em></h1>
            <p className="hero-lede">{home.heroDescription}</p>
            <div className="hero-actions">
              <Link className="button button-light" href="/quote">{home.heroPrimaryLabel} <span aria-hidden="true">↗</span></Link>
              <Link className="text-link text-link-light" href="/hosting">{home.heroSecondaryLabel} <span aria-hidden="true">↓</span></Link>
            </div>
            <div className="hero-proof"><span>BD</span><span>{home.proof}</span></div>
          </div>
          <HeroDashboard />
        </div>
        <div className="hero-bottom"><span>BUILD WITH INTENTION</span><span>01 / 04</span></div>
      </section>

      <section className="home-capabilities" aria-labelledby="capabilities-title">
        <div className="home-capabilities-heading">
          <span className="section-kicker">THE PIECES, WORKING TOGETHER</span>
          <h2 id="capabilities-title">Everything your idea needs.<br /><em>Nothing it doesn’t.</em></h2>
          <p>One thoughtful partner for the domain, the build, the foundation, and the care that follows.</p>
        </div>
        <div className="home-capability-grid">
          <div className="home-capability-column">
            <Link href="/hosting" className="home-capability-card">
              <span className="home-capability-icon">↗</span><span className="section-kicker">01 / HOSTING</span>
              <h3>A steady home for your site.</h3><p>Hosting shaped around your website and where you want to take it.</p>
              <span className="home-capability-link">Explore hosting <b>↗</b></span>
            </Link>
            <Link href="/services" className="home-capability-card">
              <span className="home-capability-icon">⌘</span><span className="section-kicker">02 / DEVELOPMENT</span>
              <h3>Made for the people who use it.</h3><p>Websites and digital tools built with care and a clear purpose.</p>
              <span className="home-capability-link">See what we build <b>↗</b></span>
            </Link>
          </div>
          <div className="home-process-card">
            <div className="home-process-top"><span className="section-kicker">A SIMPLE WAY FORWARD</span><span>01 — 04</span></div>
            <h3>Good work starts with a good conversation.</h3>
            <ol>
              <li><span>01</span><div><b>Tell us what you have in mind</b><small>We listen before recommending anything.</small></div><i>↗</i></li>
              <li><span>02</span><div><b>Shape the right approach</b><small>Clear scope, sensible next steps.</small></div><i>↗</i></li>
              <li><span>03</span><div><b>Build and bring it online</b><small>Thoughtful work, done together.</small></div><i>↗</i></li>
              <li><span>04</span><div><b>Keep moving forward</b><small>Real support beyond launch day.</small></div><i>↗</i></li>
            </ol>
            <Link className="home-process-link" href="/quote">Start a conversation <span>↗</span></Link>
          </div>
          <div className="home-capability-column">
            <Link href="/domains" className="home-capability-card">
              <span className="home-capability-icon">⌕</span><span className="section-kicker">03 / DOMAINS</span>
              <h3>Start with the right name.</h3><p>Find a domain that feels like yours and check supported extensions.</p>
              <span className="home-capability-link">Search domains <b>↗</b></span>
            </Link>
            <Link href="/support" className="home-capability-card">
              <span className="home-capability-icon">○</span><span className="section-kicker">04 / HUMAN SUPPORT</span>
              <h3>People on the other side.</h3><p>Practical guidance from real people when you need a hand.</p>
              <span className="home-capability-link">Meet our support <b>↗</b></span>
            </Link>
          </div>
        </div>
      </section>

      <HomeShowcase content={home} />

      <section className="intro-section section-wrap">
        <div className="section-kicker">{home.introKicker}</div>
        <div className="intro-grid">
          <h2>{home.introLineOne}<br />{home.introLineTwo} <em>{home.introAccent}</em></h2>
          <div>
            <p className="large-copy">{home.introLead}</p>
            <p className="muted-copy">{home.introDescription}</p>
            <Link className="text-link" href="/about">{home.introLinkLabel} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="hosting-section section-wrap">
        <div className="section-heading">
          <div><div className="section-kicker">{home.servicesKicker}</div><h2>{home.servicesLineOne}<br /><em>{home.servicesAccent}</em></h2></div>
          <p>{home.servicesDescription}</p>
        </div>
        {products.length > 0 ? (
          <div className="plan-grid">
            {products.map((product) => (
              <article className="plan-card" key={product.id}>
                <div className="plan-top"><span>{String(product.sort_order + 1).padStart(2, "0")}</span><span className="plan-dot" /></div>
                <Link
                  className="catalog-placement-link"
                  href={`${productCategoryDetails[product.category].publicPath}#product-${product.id}`}
                >
                  {productCategoryDetails[product.category].label} · View on {productCategoryDetails[product.category].publicPage} <span aria-hidden="true">↗</span>
                </Link>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <CatalogPriceList
                  prices={product.prices}
                  startingPriceBdtMinor={product.starting_price_bdt_minor}
                  startingPriceUsdMinor={product.starting_price_usd_minor}
                  startingPricePeriod={product.starting_price_period}
                />
                <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <Link href={`/quote?service=${encodeURIComponent(product.name)}`}>Discuss this service <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
        ) : <p className="empty-state">Services are being updated. <Link href="/quote">Talk to our team</Link> to discuss your project.</p>}
        <p className="pricing-note">
          {products.some((product) => product.prices.length > 0)
            ? "Configured prices are shown above. Services without a listed price require a custom quotation."
            : "Pricing is configured after we understand your needs. No placeholder prices, no surprises."}
        </p>
      </section>

      <section className="statement-section">
        <div className="statement-inner"><span className="section-kicker">{home.statementKicker}</span><p>{home.statementLineOne}<br /><em>{home.statementAccent}</em></p><Link className="text-link text-link-light" href="/services">{home.statementLinkLabel} <span aria-hidden="true">↗</span></Link></div>
        <div className="statement-mark" aria-hidden="true">d.</div>
      </section>

      {articles.length > 0 && <section className="home-journal section-wrap" aria-labelledby="home-journal-title">
        <div className="home-journal-heading">
          <div><span className="section-kicker">THE DOCKNEST JOURNAL</span><h2 id="home-journal-title">Notes for the next<br /><em>thing you build.</em></h2></div>
          <Link className="text-link" href="/blog">All articles <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="home-journal-grid">
          {articles.map((article, index) => (
            <article className="home-journal-card" key={article.id}>
              <Link href={`/blog/${article.slug}`} className={`home-journal-art home-journal-art-${index + 1}`} aria-label={`Read ${article.title}`}>
                <span className="home-journal-art-mark" aria-hidden="true">{index === 0 ? "01" : index === 1 ? "02" : "03"}</span>
                <span className="home-journal-art-shape" aria-hidden="true" />
                <span className="home-journal-art-label">DOCKNEST / JOURNAL</span>
              </Link>
              <div className="home-journal-copy">
                <span className="section-kicker">{article.published_at ? new Date(article.published_at).toLocaleDateString() : "Docknest"}</span>
                <h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3>
                <p>{article.summary}</p>
                <Link className="home-journal-read" href={`/blog/${article.slug}`}>Read article <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>}

      <section className="cta-section section-wrap">
        <div><div className="section-kicker">{home.ctaKicker}</div><h2>{home.ctaLineOne}<br /><em>{home.ctaAccent}</em></h2></div>
        <Link className="button button-light" href="/quote">{home.ctaButtonLabel} <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}
