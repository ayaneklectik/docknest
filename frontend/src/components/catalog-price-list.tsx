import { formatCatalogCurrency, type CatalogPrice } from "@/lib/catalog-types";

const periodLabels: Record<CatalogPrice["billing_period"], string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  "two-year": "Two years",
  "three-year": "Three years",
  "one-time": "One time"
};
const periodOrder = ["monthly", "yearly", "two-year", "three-year", "one-time"] as const;
const currencyOrder = ["BDT", "USD"] as const;

export function CatalogPriceList({
  prices,
  startingPriceBdtMinor = null,
  startingPriceUsdMinor = null,
  startingPricePeriod = "monthly"
}: {
  prices: CatalogPrice[];
  startingPriceBdtMinor?: number | null;
  startingPriceUsdMinor?: number | null;
  startingPricePeriod?: CatalogPrice["billing_period"];
}) {
  if (startingPriceBdtMinor !== null || startingPriceUsdMinor !== null) {
    return (
      <div className="plan-price catalog-price-list" aria-label="Starting prices">
        {startingPriceBdtMinor !== null && (
          <span className="catalog-price-item">
            <strong>Starting from {formatCatalogCurrency(startingPriceBdtMinor, "BDT")}</strong>
            <small>{periodLabels[startingPricePeriod]}</small>
          </span>
        )}
        {startingPriceUsdMinor !== null && (
          <span className="catalog-price-item">
            <strong>Starting from {formatCatalogCurrency(startingPriceUsdMinor, "USD")}</strong>
            <small>{periodLabels[startingPricePeriod]}</small>
          </span>
        )}
      </div>
    );
  }

  if (prices.length === 0) {
    return <div className="plan-price">Custom quote <span>· configured to your needs</span></div>;
  }

  const orderedPrices = [...prices].sort((left, right) =>
    periodOrder.indexOf(left.billing_period) - periodOrder.indexOf(right.billing_period)
    || currencyOrder.indexOf(left.currency) - currencyOrder.indexOf(right.currency)
  );

  return (
    <div className="plan-price catalog-price-list" aria-label="Configured prices">
      {orderedPrices.map((price) => (
        <span className="catalog-price-item" key={`${price.currency}-${price.billing_period}`}>
          <strong>{formatCatalogCurrency(price.amount_minor, price.currency)}</strong>
          <small>{periodLabels[price.billing_period]}</small>
        </span>
      ))}
    </div>
  );
}
