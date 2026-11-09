"use client";

import { useState } from "react";
import {
  billingPeriods,
  currencies,
  formatCatalogCurrency,
  productCategories,
  productCategoryDetails
} from "@/lib/catalog-types";
import type { CatalogAddon, CatalogPrice, CatalogProduct, ProductCategory } from "@/lib/catalog-types";
import Link from "next/link";

type Props = { products: CatalogProduct[]; addons: CatalogAddon[] };

function priceKey(currency: string, period: string) {
  return `${currency}-${period}`;
}

function pricesFromForm(form: FormData): CatalogPrice[] {
  const prices: CatalogPrice[] = [];
  for (const currency of currencies) {
    for (const period of billingPeriods) {
      const value = String(form.get(priceKey(currency, period)) ?? "").trim();
      if (!value) continue;
      const amount = Number(value);
      if (Number.isSafeInteger(amount) && amount >= 0) {
        prices.push({ currency, billing_period: period, amount_minor: amount });
      }
    }
  }
  return prices;
}

function startingPriceFromForm(form: FormData, name: string, multiplier: number): number | null {
  const value = String(form.get(name) ?? "").trim();
  if (!value) return null;
  const amount = Number(value);
  const minorAmount = amount * multiplier;
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(minorAmount)) {
    throw new Error("Enter a valid starting price. USD supports up to two decimal places.");
  }
  return minorAmount;
}

const periodLabels: Record<CatalogPrice["billing_period"], string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  "two-year": "Two years",
  "three-year": "Three years",
  "one-time": "One time"
};

function startingPriceText(product: CatalogProduct) {
  const prices = [
    product.starting_price_bdt_minor === null
      ? null
      : `Starting from ${formatCatalogCurrency(product.starting_price_bdt_minor, "BDT")}`,
    product.starting_price_usd_minor === null
      ? null
      : `Starting from ${formatCatalogCurrency(product.starting_price_usd_minor, "USD")}`
  ].filter((price): price is string => price !== null);
  return prices.length > 0
    ? `${prices.join(" · ")} / ${periodLabels[product.starting_price_period]}`
    : "No starting price";
}

function PriceFields({ initial }: { initial: CatalogPrice[] }) {
  return (
    <fieldset className="price-fields">
      <legend>Optional configured price (minor currency units)</legend>
      <div className="price-grid">
        {currencies.flatMap((currency) =>
          billingPeriods.map((period) => {
            const existing = initial.find(
              (price) => price.currency === currency && price.billing_period === period
            );
            return (
              <label key={priceKey(currency, period)}>
                {currency} · {period}
                <input
                  name={priceKey(currency, period)}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={existing?.amount_minor ?? ""}
                  placeholder="Not configured"
                />
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

function priceText(prices: CatalogPrice[]) {
  if (prices.length === 0) return "Quote required · no prices configured";
  return prices.map((price) =>
    `${price.currency} ${price.amount_minor} / ${price.billing_period}`
  ).join(" · ");
}

export function AdminCatalog({ products: initialProducts, addons: initialAddons }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [addons, setAddons] = useState(initialAddons);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [editingAddon, setEditingAddon] = useState<CatalogAddon | null>(null);
  const [draftCategory, setDraftCategory] = useState<ProductCategory>("hosting");
  const [startingPricePeriod, setStartingPricePeriod] = useState<CatalogPrice["billing_period"]>("monthly");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(form: FormData, type: "product" | "addon", id?: string) {
    setNotice("");
    let startingPriceBdtMinor: number | null = null;
    let startingPriceUsdMinor: number | null = null;
    if (type === "product") {
      try {
        startingPriceBdtMinor = startingPriceFromForm(form, "startingPriceBdt", 1);
        startingPriceUsdMinor = startingPriceFromForm(form, "startingPriceUsd", 100);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Enter a valid starting price.");
        return;
      }
    }
    setBusy(true);
    const body = type === "product"
      ? {
          type, id,
          name: String(form.get("name") ?? ""),
          category: String(form.get("category") ?? ""),
          description: String(form.get("description") ?? ""),
          features: String(form.get("features") ?? "").split("\n").map((value) => value.trim()).filter(Boolean),
          active: editingProduct?.active ?? true,
          sortOrder: Number(form.get("sortOrder") ?? 0),
          startingPriceBdtMinor,
          startingPriceUsdMinor,
          startingPricePeriod: String(form.get("startingPricePeriod") ?? "monthly"),
          prices: pricesFromForm(form)
        }
      : {
          type, id,
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? ""),
          active: true,
          prices: pricesFromForm(form)
        };
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Catalog item could not be saved.");
        return;
      }
      const refreshed = await fetch("/api/admin/catalog?includeInactive=true");
      if (!refreshed.ok) {
        setNotice("Saved, but the catalog could not be refreshed. Reload the page.");
        return;
      }
      const data = await refreshed.json() as { products: CatalogProduct[]; addons: CatalogAddon[] };
      setProducts(data.products);
      setAddons(data.addons);
      setEditingProduct(null);
      setEditingAddon(null);
      setDraftCategory("hosting");
      setStartingPricePeriod("monthly");
      setNotice("Catalog item saved.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function setActive(type: "product" | "addon", id: string, active: boolean) {
    try {
      const response = await fetch(`/api/admin/catalog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, active })
      });
      if (!response.ok) {
        setNotice("Catalog status could not be changed.");
        return;
      }
      if (type === "product") {
        setProducts((current) => current.map((item) => item.id === id ? { ...item, active } : item));
      } else {
        setAddons((current) => current.map((item) => item.id === id ? { ...item, active } : item));
      }
      setNotice("Catalog status updated.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <div className="catalog-admin">
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      <section className="catalog-list-section">
        <div className="admin-section-heading"><div><div className="section-kicker">Sellable services</div><h2>Plans & products</h2></div></div>
        <div className="catalog-admin-list">
          {products.map((product) => (
            <article key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <span>{productCategoryDetails[product.category].label} · {product.active ? "Published" : "Archived"}</span>
                <span>{startingPriceText(product)} · {priceText(product.prices)}</span>
                <Link className="catalog-admin-placement" href={`${productCategoryDetails[product.category].publicPath}#product-${product.id}`} target="_blank">
                  Public location: {productCategoryDetails[product.category].placement} ↗
                </Link>
              </div>
              <button type="button" onClick={() => {
                setEditingProduct(product);
                setEditingAddon(null);
                setDraftCategory(product.category);
                setStartingPricePeriod(product.starting_price_period);
              }}>Edit</button>
              <button type="button" onClick={() => void setActive("product", product.id, !product.active)}>{product.active ? "Archive" : "Restore"}</button>
            </article>
          ))}
          {products.length === 0 && <p className="empty-state">No products configured. Add a plan below.</p>}
        </div>
      </section>

      <section className="catalog-form-card">
        <div className="admin-section-heading"><div><div className="section-kicker">Administrator-managed pricing</div><h2>{editingProduct ? `Edit ${editingProduct.name}` : "Add a product"}</h2></div></div>
        <form key={editingProduct?.id ?? "new-product"} action={(form) => void save(form, "product", editingProduct?.id)} className="quote-form">
          <div className="form-grid">
            <label>Name<input name="name" required minLength={2} maxLength={120} defaultValue={editingProduct?.name ?? ""} /></label>
            <label>Category<select name="category" value={draftCategory} onChange={(event) => {
              const category = productCategories.find((item) => item === event.target.value);
              if (category) setDraftCategory(category);
            }}>{productCategories.map((category) => <option key={category} value={category}>{productCategoryDetails[category].label}</option>)}</select></label>
            <label className="form-wide">Description<textarea name="description" rows={2} maxLength={1000} defaultValue={editingProduct?.description ?? ""} /></label>
            <label className="form-wide">Features (one per line)<textarea name="features" rows={3} maxLength={2000} defaultValue={editingProduct?.features.join("\n") ?? ""} /></label>
            <label>Display order<input name="sortOrder" type="number" min="0" max="10000" defaultValue={editingProduct?.sort_order ?? 0} /></label>
          </div>
          <fieldset className="starting-price-fields">
            <legend>Starting from price (optional, shown on the public site)</legend>
            <p>Enter normal taka and dollar amounts. This display price does not change quotation calculations.</p>
            <div className="price-grid">
              <label>BDT · taka
                <input
                  name="startingPriceBdt"
                  type="number"
                  min="0"
                  max="1000000000"
                  step="1"
                  defaultValue={editingProduct?.starting_price_bdt_minor ?? ""}
                  placeholder="Not set"
                />
              </label>
              <label>USD · dollars
                <input
                  name="startingPriceUsd"
                  type="number"
                  min="0"
                  max="1000000000"
                  step="0.01"
                  defaultValue={!editingProduct || editingProduct.starting_price_usd_minor === null ? "" : editingProduct.starting_price_usd_minor / 100}
                  placeholder="Not set"
                />
              </label>
              <label>Billing period
                <select name="startingPricePeriod" value={startingPricePeriod} onChange={(event) => {
                  const period = billingPeriods.find((item) => item === event.target.value);
                  if (period) setStartingPricePeriod(period);
                }}>
                  {billingPeriods.map((period) => <option value={period} key={period}>{periodLabels[period]}</option>)}
                </select>
              </label>
            </div>
          </fieldset>
          <div className="catalog-placement-preview">
            <strong>Where customers will see this</strong>
            <span>{productCategoryDetails[draftCategory].placement}.</span>
            <Link href={productCategoryDetails[draftCategory].publicPath} target="_blank">
              Preview the {productCategoryDetails[draftCategory].publicPage} ↗
            </Link>
          </div>
          <PriceFields initial={editingProduct?.prices ?? []} />
          <div className="form-submit"><button className="button button-dark" disabled={busy} type="submit">{busy ? "Saving…" : "Save product"}</button>{editingProduct && <button className="text-button" type="button" onClick={() => { setEditingProduct(null); setDraftCategory("hosting"); setStartingPricePeriod("monthly"); }}>Cancel edit</button>}<span className="muted-copy">Leave starting prices blank to hide them. Starting prices are display-only; configured prices below are used for quotes.</span></div>
        </form>
      </section>

      <section className="catalog-list-section">
        <div className="admin-section-heading"><div><div className="section-kicker">Optional extras</div><h2>Add-ons</h2></div></div>
        <div className="catalog-admin-list">
          {addons.map((addon) => (
            <article key={addon.id}>
              <div><strong>{addon.name}</strong><span>{priceText(addon.prices)}</span></div>
              <button type="button" onClick={() => { setEditingAddon(addon); setEditingProduct(null); }}>Edit</button>
              <button type="button" onClick={() => void setActive("addon", addon.id, !addon.active)}>{addon.active ? "Archive" : "Restore"}</button>
            </article>
          ))}
          {addons.length === 0 && <p className="empty-state">No add-ons configured yet.</p>}
        </div>
      </section>

      <section className="catalog-form-card">
        <div className="admin-section-heading"><div><div className="section-kicker">Optional extras</div><h2>{editingAddon ? `Edit ${editingAddon.name}` : "Add an add-on"}</h2></div></div>
        <form action={(form) => void save(form, "addon", editingAddon?.id)} className="quote-form">
          <label>Name<input name="name" required minLength={2} maxLength={120} defaultValue={editingAddon?.name ?? ""} /></label>
          <label>Description<textarea name="description" rows={2} maxLength={1000} defaultValue={editingAddon?.description ?? ""} /></label>
          <PriceFields initial={editingAddon?.prices ?? []} />
          <div className="form-submit"><button className="button button-dark" disabled={busy} type="submit">{busy ? "Saving…" : "Save add-on"}</button>{editingAddon && <button className="text-button" type="button" onClick={() => setEditingAddon(null)}>Cancel edit</button>}</div>
        </form>
      </section>
    </div>
  );
}
