import Link from "next/link";
import { HomeShowcase } from "@/components/home-showcase";
import { HeroDashboard } from "@/components/hero-dashboard";
import { listPublishedArticles } from "@backend/content";
import { getSiteContent } from "@backend/site-content";
import { listProducts } from "@backend/catalog";
import { CatalogPriceList } from "@/components/catalog-price-list";
import { productCategoryDetails } from "@/lib/catalog-types";

export const dynamic = "force-dynamic";

const heroBackgroundWords = [
  { label: "domain", left: 6, top: 18, size: 11, opacity: 0.14, duration: 16, delay: 0, tone: "soft" },
  { label: "startup", left: 18, top: 25, size: 10, opacity: 0.12, duration: 18, delay: 1, tone: "soft" },
  { label: "hosting", left: 32, top: 19, size: 12, opacity: 0.18, duration: 14, delay: 2, tone: "accent" },
  { label: "cloud", left: 41, top: 29, size: 11, opacity: 0.12, duration: 17, delay: 3, tone: "soft" },
  { label: "brand", left: 54, top: 22, size: 10, opacity: 0.12, duration: 21, delay: 1.5, tone: "soft" },
  { label: "launch", left: 68, top: 28, size: 12, opacity: 0.16, duration: 19, delay: 2.5, tone: "accent" },
  { label: "stack", left: 83, top: 15, size: 10, opacity: 0.12, duration: 15, delay: 0.5, tone: "soft" },
  { label: ".com", left: 88, top: 35, size: 14, opacity: 0.22, duration: 13, delay: 3.5, tone: "accent" },
  { label: "website", left: 10, top: 40, size: 11, opacity: 0.12, duration: 18, delay: 4, tone: "soft" },
  { label: "design", left: 24, top: 46, size: 10, opacity: 0.12, duration: 17, delay: 7, tone: "soft" },
  { label: "support", left: 37, top: 49, size: 11, opacity: 0.14, duration: 15, delay: 5, tone: "soft" },
  { label: "care", left: 52, top: 44, size: 10, opacity: 0.12, duration: 20, delay: 9, tone: "soft" },
  { label: "api", left: 64, top: 52, size: 11, opacity: 0.13, duration: 18, delay: 3, tone: "soft" },
  { label: "automation", left: 78, top: 49, size: 11, opacity: 0.12, duration: 22, delay: 8, tone: "soft" },
  { label: "commerce", left: 12, top: 62, size: 11, opacity: 0.14, duration: 14, delay: 11, tone: "soft" },
  { label: "render", left: 30, top: 68, size: 10, opacity: 0.12, duration: 19, delay: 4, tone: "soft" },
  { label: "market", left: 44, top: 72, size: 11, opacity: 0.14, duration: 16, delay: 10, tone: "soft" },
  { label: "provision", left: 58, top: 64, size: 10, opacity: 0.12, duration: 23, delay: 6.5, tone: "soft" },
  { label: "security", left: 74, top: 72, size: 11, opacity: 0.13, duration: 17, delay: 9.5, tone: "accent" },
  { label: "growth", left: 88, top: 66, size: 10, opacity: 0.12, duration: 20, delay: 7, tone: "soft" },
  { label: "dns", left: 16, top: 82, size: 12, opacity: 0.15, duration: 17, delay: 12, tone: "accent" },
  { label: "email", left: 28, top: 86, size: 10, opacity: 0.12, duration: 21, delay: 8.5, tone: "soft" },
  { label: "builder", left: 43, top: 84, size: 11, opacity: 0.13, duration: 18, delay: 13, tone: "soft" },
  { label: "software", left: 58, top: 90, size: 11, opacity: 0.13, duration: 15, delay: 5.5, tone: "soft" },
  { label: "community", left: 72, top: 86, size: 10, opacity: 0.12, duration: 18, delay: 10.5, tone: "soft" },
  { label: "traffic", left: 82, top: 90, size: 11, opacity: 0.12, duration: 20, delay: 6, tone: "soft" },
  { label: "studio", left: 6, top: 58, size: 12, opacity: 0.16, duration: 19, delay: 14, tone: "soft" },
  { label: "identity", left: 90, top: 52, size: 10, opacity: 0.12, duration: 18, delay: 3.5, tone: "soft" },
  { label: "io", left: 62, top: 14, size: 13, opacity: 0.16, duration: 16, delay: 15, tone: "accent" },
  { label: "data", left: 20, top: 34, size: 10, opacity: 0.12, duration: 22, delay: 11, tone: "soft" },
  { label: "local", left: 49, top: 59, size: 9, opacity: 0.11, duration: 23, delay: 12.5, tone: "soft" },
  { label: "ops", left: 73, top: 35, size: 10, opacity: 0.12, duration: 19, delay: 7.5, tone: "soft" },
  { label: "tld", left: 36, top: 12, size: 9, opacity: 0.11, duration: 22, delay: 13, tone: "soft" },
  { label: "edge", left: 57, top: 80, size: 10, opacity: 0.12, duration: 17, delay: 6, tone: "soft" },
  { label: "global", left: 47, top: 92, size: 10, opacity: 0.12, duration: 20, delay: 14, tone: "soft" },
  { label: "infra", left: 74, top: 58, size: 9, opacity: 0.11, duration: 15, delay: 9, tone: "soft" },
  { label: "users", left: 88, top: 84, size: 9, opacity: 0.11, duration: 21, delay: 11, tone: "soft" },
  { label: "portal", left: 12, top: 72, size: 10, opacity: 0.12, duration: 18, delay: 16, tone: "soft" },
  { label: "launchpad", left: 64, top: 45, size: 9, opacity: 0.11, duration: 24, delay: 7.5, tone: "soft" },
  { label: "b2b", left: 28, top: 55, size: 9, opacity: 0.11, duration: 19, delay: 18, tone: "soft" },
  { label: "payments", left: 82, top: 24, size: 9, opacity: 0.12, duration: 20, delay: 12.5, tone: "soft" },
  { label: "web", left: 52, top: 35, size: 11, opacity: 0.15, duration: 16, delay: 9, tone: "soft" },
  { label: "index", left: 7, top: 48, size: 10, opacity: 0.12, duration: 18, delay: 5.5, tone: "soft" },
];

export default function HomePage() {
  const { home } = getSiteContent();
  const products = listProducts();
  const articles = listPublishedArticles("blog").slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="hero-word-matrix" aria-hidden="true">
          {heroBackgroundWords.map((word, index) => (
            <span
              key={`${word.label}-${index}`}
              className={`hero-word hero-word-${word.tone}`}
              style={{
                left: `${word.left}%`,
                top: `${word.top}%`,
                fontSize: `${word.size}px`,
                opacity: word.opacity,
                animationDuration: `${word.duration}s`,
                animationDelay: `${word.delay}s`,
                ["--word-opacity"]: String(word.opacity),
                ["--word-rotate"]: `${(index % 2 === 0 ? 1 : -1) * (index % 5) * 2.5}deg`,
              } as React.CSSProperties}
            >
              {word.label}
            </span>
          ))}
        </div>
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
