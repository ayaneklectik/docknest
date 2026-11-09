import Link from "next/link";
import Image from "next/image";
import { getSiteContent } from "@backend/site-content";

export function SiteFooter() {
  const { brand, footer } = getSiteContent();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-cta">
          <div>
            <span className="section-kicker">{footer.calloutKicker}</span>
            <h2>{footer.calloutLineOne}<br /><em>{footer.calloutAccent}</em></h2>
          </div>
          <Link className="button button-light" href="/quote">
            {footer.calloutButton} <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand brand-light" href="/" aria-label={`${brand.name} home`}>
              {brand.logoUrl
                ? <Image className="brand-image" src={brand.logoUrl} alt="" width={38} height={38} unoptimized />
                : <span className="brand-mark" aria-hidden="true">d<span>.</span></span>}
              <span>{brand.name}</span>
            </Link>
            <p>{brand.footerDescription}</p>
            {brand.email && <a className="footer-contact-link" href={`mailto:${brand.email}`}>{brand.email}</a>}
            {brand.phone && <a className="footer-contact-link" href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}>{brand.phone}</a>}
            <span className="footer-location">{brand.location}</span>
            <Link className="footer-contact-link" href="/contact">Get in touch <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="footer-column">
            <h2>Explore</h2>
            <Link href="/hosting">Hosting</Link>
            <Link href="/services">Development</Link>
            <Link href="/domains">Domains</Link>
            <Link href="/blog">Blog</Link>
          </div>
          <div className="footer-column">
            <h2>Company</h2>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/support">Support</Link>
            <Link href="/knowledge-base">Knowledge base</Link>
          </div>
          <div className="footer-column">
            <h2>Legal</h2>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund-policy">Refund policy</Link>
            <Link href="/sla">Service levels</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {brand.name}. Built for the next.</span>
          <span>{brand.location}</span>
        </div>
      </div>
      <div className="footer-watermark" aria-hidden="true">d.</div>
    </footer>
  );
}
