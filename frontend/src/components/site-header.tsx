import Link from "next/link";
import Image from "next/image";
import { getSiteContent } from "@backend/site-content";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteNavigation } from "@/components/site-navigation";

export function SiteHeader() {
  const { brand, navigation } = getSiteContent();
  const links = [
    { href: "/hosting", label: navigation.hosting },
    { href: "/services", label: navigation.development },
    { href: "/domains", label: navigation.domains },
    { href: "/about", label: navigation.about },
    { href: "/blog", label: navigation.journal }
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label={`${brand.name} home`}>
          {brand.logoUrl
            ? <Image className="brand-image" src={brand.logoUrl} alt="" width={38} height={38} unoptimized />
            : <span className="brand-mark" aria-hidden="true">d<span>.</span></span>}
          <span>{brand.name}</span>
        </Link>
        <SiteNavigation links={links} />
        <div className="header-actions">
          <ThemeToggle />
          <Link className="button button-light header-cta" href="/quote">
            {navigation.cta} <span aria-hidden="true">↗</span>
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open menu"><span aria-hidden="true">☰</span></summary>
            <nav aria-label="Mobile navigation">
              {links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link href="/quote">{navigation.cta}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
