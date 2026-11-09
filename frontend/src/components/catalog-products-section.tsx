import Link from "next/link";
import { CatalogPriceList } from "@/components/catalog-price-list";
import type { CatalogProduct } from "@/lib/catalog-types";
import { productCategoryDetails } from "@/lib/catalog-types";

export function CatalogProductsSection({
  products,
  title,
  description
}: {
  products: CatalogProduct[];
  title: string;
  description: string;
}) {
  if (products.length === 0) return null;
  return (
    <div className="public-catalog-section">
      <div className="section-heading">
        <div>
          <div className="section-kicker">PLANS & PRICING</div>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className="catalog-plan-grid">
        {products.map((product) => {
          const category = productCategoryDetails[product.category];
          return (
            <article className="plan-card" id={`product-${product.id}`} key={product.id}>
              <span className="catalog-category-label">{category.label}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <CatalogPriceList
                prices={product.prices}
                startingPriceBdtMinor={product.starting_price_bdt_minor}
                startingPriceUsdMinor={product.starting_price_usd_minor}
                startingPricePeriod={product.starting_price_period}
              />
              {product.features.length > 0 && (
                <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              )}
              <Link href={`/quote?service=${encodeURIComponent(product.name)}`}>
                Ask about this service <span aria-hidden="true">↗</span>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
