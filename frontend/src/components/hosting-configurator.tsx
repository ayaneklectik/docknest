"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getConfiguredPrice, type CatalogAddon, type CatalogProduct } from "@/lib/catalog-types";

const periods = ["monthly", "yearly", "two-year", "three-year"] as const;
type Currency = "BDT" | "USD";
type Props = { products: CatalogProduct[]; addons: CatalogAddon[] };

function formatPrice(amountMinor: number, currency: Currency) {
  const amount = currency === "USD" ? amountMinor / 100 : amountMinor;
  return new Intl.NumberFormat(currency === "BDT" ? "en-BD" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0
  }).format(amount);
}

function periodLabel(period: string) {
  return period === "two-year" ? "Two years"
    : period === "three-year" ? "Three years"
      : period === "one-time" ? "One time"
        : period === "yearly" ? "Yearly" : "Monthly";
}

export function HostingConfigurator({ products, addons }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [currency, setCurrency] = useState<Currency>("BDT");
  const [period, setPeriod] = useState<(typeof periods)[number]>("monthly");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const product = products.find((item) => item.id === productId);
  const selectedExtras = addons.filter((addon) => selectedAddons.includes(addon.id));
  const estimate = useMemo(() => {
    if (!product) return null;
    const base = getConfiguredPrice(product.prices, currency, period);
    if (base === null) return null;
    let total = base;
    for (const addon of selectedExtras) {
      const addonPrice = getConfiguredPrice(addon.prices, currency, period);
      if (addonPrice === null) return null;
      total += addonPrice;
    }
    return total;
  }, [product, selectedExtras, currency, period]);

  function toggleAddon(id: string) {
    setSelectedAddons((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!product) {
      setMessage("Please choose an available hosting plan.");
      return;
    }
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    const requirements = [
      `Hosting plan: ${product.name}`,
      `Currency: ${currency}; billing: ${periodLabel(period)}`,
      `Storage: ${String(form.get("storage") ?? "")}`,
      `Expected monthly traffic: ${String(form.get("traffic") ?? "")}`,
      `Websites: ${String(form.get("websites") ?? "")}`,
      `Performance: ${String(form.get("performance") ?? "")}`,
      `Backups: ${String(form.get("backups") ?? "")}`,
      `Security: ${String(form.get("security") ?? "")}`,
      `Control panel: ${String(form.get("controlPanel") ?? "")}`,
      `Additional requirements: ${String(form.get("details") ?? "")}`
    ].join("\n");

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          company: String(form.get("company") ?? ""),
          service: product.name,
          billingPeriod: period,
          currency,
          productId: product.id,
          addonIds: selectedAddons,
          requirements
        })
      });
      const result = await response.json() as { error?: string; message?: string; id?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Your request could not be submitted.");
        return;
      }
      setMessage(
        estimate === null
          ? "Request received. Pricing is not fully configured, so the Docknest team will prepare a manual quotation."
          : `Request received. Configured estimate: ${formatPrice(estimate, currency)} / ${periodLabel(period)}. Docknest will confirm the final quotation.`
      );
      if (result.id) router.refresh();
      formElement.reset();
    } catch {
      setMessage("A network error interrupted your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="notice-box">
        <strong>Hosting plans are being configured</strong>
        <p>Request a custom hosting consultation while our team sets up the product catalogue.</p>
        <a className="text-link" href="/quote?service=Custom%20hosting">Request a custom quote ↗</a>
      </div>
    );
  }

  return (
    <form className="configurator" onSubmit={submit}>
      <div className="configurator-heading">
        <div><span className="section-kicker">Configure your requirements</span><h2>Start with the workload.</h2></div>
        <span className="configurator-step">01 — 04</span>
      </div>
      <div className="configurator-layout">
        <div className="configurator-options">
          <label className="config-field">Hosting plan
            <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
              {products.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            {product && <span>{product.description}</span>}
          </label>
          <div className="form-grid">
            <label>Storage needed
              <select name="storage" defaultValue="not-sure"><option value="not-sure">Not sure</option><option>Up to 10 GB</option><option>10–50 GB</option><option>50–100 GB</option><option>More than 100 GB</option></select>
            </label>
            <label>Expected monthly traffic
              <select name="traffic" defaultValue="not-sure"><option value="not-sure">Not sure</option><option>Under 10,000 visits</option><option>10,000–100,000 visits</option><option>Over 100,000 visits</option></select>
            </label>
            <label>Number of websites<input name="websites" type="number" min="1" max="1000" defaultValue="1" required /></label>
            <label>Performance needs
              <select name="performance" defaultValue="standard"><option value="standard">Standard website</option><option>Busy business site</option><option>High-performance workload</option><option>Discuss with me</option></select>
            </label>
            <label>Backups
              <select name="backups" defaultValue="recommend"><option value="recommend">Recommend a schedule</option><option>Daily</option><option>Weekly</option><option>Not required</option></select>
            </label>
            <label>Security
              <select name="security" defaultValue="standard"><option value="standard">Standard security</option><option>Malware scanning</option><option>Advanced security review</option></select>
            </label>
            <label>Control panel
              <select name="controlPanel" defaultValue="recommend"><option value="recommend">Recommend one</option><option>cPanel (license quoted separately)</option><option>Docker-based environment</option><option>No preference</option></select>
            </label>
            <label>Currency
              <select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}><option value="BDT">BDT</option><option value="USD">USD</option></select>
            </label>
            <label>Billing period
              <select value={period} onChange={(event) => setPeriod(event.target.value as (typeof periods)[number])}>{periods.map((value) => <option key={value} value={value}>{periodLabel(value)}</option>)}</select>
            </label>
          </div>
          {addons.length > 0 && (
            <fieldset className="addon-options">
              <legend>Optional add-ons</legend>
              {addons.map((addon) => {
                const price = getConfiguredPrice(addon.prices, currency, period);
                return (
                  <label key={addon.id}>
                    <input type="checkbox" checked={selectedAddons.includes(addon.id)} onChange={() => toggleAddon(addon.id)} />
                    <span><strong>{addon.name}</strong><small>{addon.description}</small></span>
                    <span className="addon-price">{price === null ? "Quote required" : formatPrice(price, currency)}</span>
                  </label>
                );
              })}
            </fieldset>
          )}
          <label>Additional requirements<textarea name="details" maxLength={2000} rows={3} placeholder="Anything else we should consider?" /></label>
          <div className="configurator-customer">
            <span className="section-kicker">Where should we send your quotation?</span>
            <div className="form-grid">
              <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
              <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
              <label>Contact number<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={40} required /></label>
              <label className="form-wide">Business or project<input name="company" maxLength={120} /></label>
            </div>
          </div>
        </div>
        <aside className="configurator-summary">
          <span className="section-kicker">Your configuration</span>
          <h3>{product?.name}</h3>
          <p>{selectedExtras.length} add-on{selectedExtras.length === 1 ? "" : "s"} selected</p>
          <div className="summary-total">
            <span>{estimate === null ? "Custom quotation" : `${formatPrice(estimate, currency)} / ${periodLabel(period)}`}</span>
            <small>{estimate === null ? "One or more prices need administrator configuration." : "Estimate only; the final quotation is confirmed by Docknest."}</small>
          </div>
          <button className="button button-dark" disabled={busy} type="submit">{busy ? "Sending…" : "Request this configuration"} <span aria-hidden="true">↗</span></button>
          <p>No payment is collected. A request does not create an order or provision a service.</p>
          <p className="form-message" aria-live="polite" role="status">{message}</p>
        </aside>
      </div>
    </form>
  );
}
