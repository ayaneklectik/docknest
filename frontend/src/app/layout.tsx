import type { Metadata } from "next";
import { getSiteContent } from "@backend/site-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateMetadata(): Metadata {
  const { brand } = getSiteContent();
  const title = `${brand.name} — ${brand.tagline}`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${brand.name}` },
    description: brand.footerDescription,
    openGraph: {
      type: "website",
      siteName: brand.name,
      title,
      description: brand.footerDescription
    },
    robots: { index: true, follow: true }
  };
}

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
