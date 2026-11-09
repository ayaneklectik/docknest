import type { Metadata } from "next";
import { DomainSearch } from "@/components/domain-search";
import { CatalogProductsSection } from "@/components/catalog-products-section";
import { listProducts } from "@backend/catalog";

export const metadata: Metadata = {
  title: "Domain Search",
  description: "Check domain availability using registry data and ask Docknest to help with registration."
};

export default async function DomainsPage({
  searchParams
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const domain = name?.trim().slice(0, 253);
  const products = listProducts("domain");
  return (
    <div className="page-shell domain-page">
      <section className="domain-hero">
        <p className="eyebrow"><span className="status-dot" /> YOUR NAME, YOUR CORNER OF THE WEB</p>
        <h1>Search for your next<br />big idea <em>online.</em></h1>
        <p>Find a name that feels like yours. Check supported extensions instantly, then let Docknest help with the next step.</p>
        <DomainSearch initialName={domain} />
      </section>
      <section className="domain-highlights" aria-label="Domain search information">
        <article className="domain-highlight domain-highlight-featured">
          <span className="domain-highlight-label">START WITH A NAME</span>
          <div className="domain-highlight-art" aria-hidden="true"><span>www</span><i /><b>.</b></div>
          <div className="domain-highlight-copy">
            <h2>Make it yours<br />on the web.</h2>
            <p>Search the name you have in mind. We’ll show what the registry currently reports.</p>
          </div>
        </article>
        <article className="domain-highlight">
          <span className="domain-highlight-label">LIVE LOOKUP</span>
          <div className="domain-highlight-icon" aria-hidden="true">⌕</div>
          <div className="domain-highlight-copy">
            <h2>Registry-backed<br />results</h2>
            <p>Live checks are available for supported extensions, including .com and .net.</p>
          </div>
        </article>
        <article className="domain-highlight">
          <span className="domain-highlight-label">LOCAL EXTENSIONS</span>
          <div className="domain-highlight-extension" aria-hidden="true">.bd</div>
          <div className="domain-highlight-copy">
            <h2>Need a .bd<br />domain?</h2>
            <p>Some local extensions need a manual check. Send a request and our team can help.</p>
          </div>
        </article>
      </section>
      <section className="content-section">
        <CatalogProductsSection
          products={products}
          title="Domain services"
          description="Review configured domain services and prices, or request help with your domain."
        />
      </section>
    </div>
  );
}
