export const billingPeriods = ["monthly", "yearly", "two-year", "three-year", "one-time"] as const;
export const currencies = ["BDT", "USD"] as const;
export const productCategories = ["hosting", "development", "maintenance", "domain"] as const;

export type ProductCategory = (typeof productCategories)[number];

export const productCategoryDetails: Record<ProductCategory, {
  label: string;
  publicPage: string;
  publicPath: string;
  placement: string;
}> = {
  hosting: {
    label: "Hosting",
    publicPage: "Hosting page",
    publicPath: "/hosting",
    placement: "Homepage service cards and the Hosting page"
  },
  development: {
    label: "Development",
    publicPage: "Development services page",
    publicPath: "/services",
    placement: "Homepage service cards and the Development services page"
  },
  maintenance: {
    label: "Maintenance",
    publicPage: "Development services page",
    publicPath: "/services",
    placement: "Homepage service cards and the Development services page"
  },
  domain: {
    label: "Domains",
    publicPage: "Domains page",
    publicPath: "/domains",
    placement: "Homepage service cards and the Domains page"
  }
};

export type CatalogPrice = {
  currency: (typeof currencies)[number];
  billing_period: (typeof billingPeriods)[number];
  amount_minor: number;
};

export function formatCatalogCurrency(amountMinor: number, currency: CatalogPrice["currency"]): string {
  const amount = currency === "USD" ? amountMinor / 100 : amountMinor;
  return new Intl.NumberFormat(currency === "BDT" ? "en-BD" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0
  }).format(amount);
}

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  features: string[];
  active: boolean;
  sort_order: number;
  starting_price_bdt_minor: number | null;
  starting_price_usd_minor: number | null;
  starting_price_period: CatalogPrice["billing_period"];
  prices: CatalogPrice[];
};

export type CatalogAddon = {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  prices: CatalogPrice[];
};

export function getConfiguredPrice(
  prices: CatalogPrice[],
  currency: CatalogPrice["currency"],
  billingPeriod: CatalogPrice["billing_period"]
): number | null {
  return prices.find((price) =>
    price.currency === currency && price.billing_period === billingPeriod
  )?.amount_minor ?? null;
}
