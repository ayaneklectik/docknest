import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";
import { enqueueEmail } from "@backend/email";
import type { QuoteRequestInput, QuoteStatus } from "@/lib/quote";
import { getConfiguredPrice } from "@/lib/catalog-types";

export type QuoteRecord = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string;
  billing_period: string | null;
  requirements: string;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
  currency: "BDT" | "USD" | null;
  estimate_total_minor: number | null;
  quoted_total_minor: number | null;
  admin_note: string;
  quote_expires_at: string | null;
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_amount_minor: number;
  }>;
};

export function createQuoteRequest(input: QuoteRequestInput): string {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }

  const id = randomUUID();
  const email = input.email.toLowerCase();
  const currency = input.currency;
  const period = input.billingPeriod ?? "monthly";

  const create = db.transaction(() => {
    let customer = db.prepare("SELECT id FROM customers WHERE email = ?").get(email) as { id: string } | undefined;
    if (!customer) {
      customer = { id: randomUUID() };
      db.prepare(
        "INSERT INTO customers (id, name, email, company, phone) VALUES (?, ?, ?, ?, ?)"
      ).run(customer.id, input.name, email, input.company || null, input.phone);
    } else {
      db.prepare(
        `UPDATE customers SET name = ?, company = COALESCE(?, company), phone = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(input.name, input.company || null, input.phone, customer.id);
    }

    let estimateTotal: number | null = null;
    const config: Record<string, unknown> = {
      billingPeriod: input.billingPeriod ?? null,
      currency,
      addonIds: input.addonIds
    };

    if (input.productId) {
      const product = db.prepare(
        "SELECT id, name, category FROM products WHERE id = ? AND active = 1"
      ).get(input.productId) as { id: string; name: string; category: string } | undefined;
      if (!product || product.category !== "hosting") {
        throw new Error("The selected hosting plan is unavailable.");
      }
      config.productId = product.id;
      config.productName = product.name;
    }

    if (input.addonIds.length > 0) {
      const placeholders = input.addonIds.map(() => "?").join(",");
      const addons = db.prepare(
        `SELECT id, name FROM addons WHERE active = 1 AND id IN (${placeholders})`
      ).all(...input.addonIds) as Array<{ id: string; name: string }>;
      if (addons.length !== new Set(input.addonIds).size) {
        throw new Error("One or more selected add-ons are unavailable.");
      }
      config.addonNames = addons.map((addon) => addon.name);
    }

    const items: Array<{
      product_id: string | null;
      addon_id: string | null;
      description: string;
      amount: number;
    }> = [];
    let total = 0;
    let pricingComplete = Boolean(input.productId);

    if (input.productId) {
      const rows = db.prepare(
        "SELECT currency, billing_period, amount_minor FROM product_prices WHERE product_id = ?"
      ).all(input.productId) as Array<{ currency: "BDT" | "USD"; billing_period: "monthly" | "yearly" | "two-year" | "three-year" | "one-time"; amount_minor: number }>;
      const amount = input.billingPeriod
        ? getConfiguredPrice(rows, currency, input.billingPeriod)
        : null;
      if (amount === null) pricingComplete = false;
      else total += amount;
      const productName = (config.productName as string) ?? input.service;
      items.push({
        product_id: input.productId,
        addon_id: null,
        description: productName,
        amount: amount ?? 0
      });
    }

    for (const addonId of input.addonIds) {
      const addon = db.prepare("SELECT name FROM addons WHERE id = ?").get(addonId) as { name: string };
      const rows = db.prepare(
        "SELECT currency, billing_period, amount_minor FROM addon_prices WHERE addon_id = ?"
      ).all(addonId) as Array<{ currency: "BDT" | "USD"; billing_period: "monthly" | "yearly" | "two-year" | "three-year" | "one-time"; amount_minor: number }>;
      const amount = input.billingPeriod
        ? getConfiguredPrice(rows, currency, input.billingPeriod)
        : null;
      if (amount === null) pricingComplete = false;
      else total += amount;
      items.push({
        product_id: null,
        addon_id: addonId,
        description: addon.name,
        amount: amount ?? 0
      });
    }

    if (pricingComplete && items.length > 0) estimateTotal = total;

    const service = (config.productName as string | undefined) ?? input.service;
    const requirements = input.requirements;
    db.prepare(
      `INSERT INTO quote_requests
        (id, customer_id, name, email, company, service, billing_period, requirements,
         currency, estimate_total_minor, configuration_json)
       VALUES
        (@id, @customer_id, @name, @email, @company, @service, @billing_period,
         @requirements, @currency, @estimate_total_minor, @configuration_json)`
    ).run({
      id,
      customer_id: customer.id,
      name: input.name,
      email,
      company: input.company || null,
      service,
      billing_period: input.billingPeriod ?? null,
      requirements,
      currency: estimateTotal === null ? null : currency,
      estimate_total_minor: estimateTotal,
      configuration_json: JSON.stringify(config)
    });

    if (estimateTotal !== null) {
      const insertItem = db.prepare(
        `INSERT INTO quote_items
         (id, quote_id, product_id, addon_id, description, quantity, unit_amount_minor, currency, billing_period)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`
      );
      for (const item of items) {
        insertItem.run(
          randomUUID(), id, item.product_id, item.addon_id, item.description,
          item.amount, currency, period
        );
      }
    }
    enqueueEmail(
      email,
      "Docknest received your quotation request",
      `Hello ${input.name},\n\nWe have received your request for ${service} and recorded it for team review. This is an automated acknowledgement, not a quotation or response-time commitment.\n\nPlease reply only to an address you have independently verified as belonging to Docknest.`
    );
  });
  create();
  return id;
}

export function listQuoteRequests(search = ""): QuoteRecord[] {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }

  const term = `%${search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const quotes = db
    .prepare(
      `SELECT id, name, email, company, service, billing_period, requirements,
              status, created_at, updated_at, currency, estimate_total_minor,
              quoted_total_minor, admin_note, quote_expires_at
       FROM quote_requests
       WHERE name LIKE @term ESCAPE '\\'
          OR email LIKE @term ESCAPE '\\'
          OR service LIKE @term ESCAPE '\\'
       ORDER BY created_at DESC
       LIMIT 200`
    )
    .all({ term }) as Array<Omit<QuoteRecord, "line_items">>;
  const getItems = db.prepare(
    `SELECT id, description, quantity, unit_amount_minor
     FROM quote_items WHERE quote_id = ? ORDER BY created_at ASC`
  );
  return quotes.map((quote) => ({
    ...quote,
    line_items: getItems.all(quote.id) as QuoteRecord["line_items"]
  }));
}

export function updateQuoteStatus(id: string, status: QuoteStatus, actorId: string): boolean {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }
  if (status === "converted") return false;
  const update = db.transaction(() => {
    const result = db.prepare(
      `UPDATE quote_requests
       SET status = @status, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = @id AND status != 'converted'`
    ).run({ id, status });
    if (result.changes === 1) {
      db.prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, 'quote.status_changed', 'quote', ?, ?)`
      ).run(randomUUID(), actorId, id, JSON.stringify({ status }));
    }
    return result.changes === 1;
  });
  return update();
}
