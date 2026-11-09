import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";
import {
  type CatalogAddon,
  type CatalogPrice,
  type CatalogProduct
} from "@/lib/catalog-types";
export type { CatalogAddon, CatalogPrice, CatalogProduct } from "@/lib/catalog-types";
export { billingPeriods, currencies, productCategories } from "@/lib/catalog-types";

function assertCatalogReady() {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function listProducts(category?: CatalogProduct["category"], includeInactive = false): CatalogProduct[] {
  assertCatalogReady();
  const rows = db.prepare(
    `SELECT id, slug, name, category, description, features_json, active, sort_order,
            starting_price_bdt_minor, starting_price_usd_minor, starting_price_period
     FROM products
     WHERE (@category IS NULL OR category = @category)
       AND (@includeInactive = 1 OR active = 1)
     ORDER BY sort_order, name`
  ).all({ category: category ?? null, includeInactive: includeInactive ? 1 : 0 }) as Array<{
    id: string; slug: string; name: string; category: CatalogProduct["category"];
    description: string; features_json: string; active: number; sort_order: number;
    starting_price_bdt_minor: number | null; starting_price_usd_minor: number | null;
    starting_price_period: CatalogPrice["billing_period"];
  }>;
  const prices = db.prepare(
    `SELECT product_id, currency, billing_period, amount_minor
     FROM product_prices ORDER BY currency, billing_period`
  ).all() as Array<{ product_id: string; currency: CatalogPrice["currency"]; billing_period: CatalogPrice["billing_period"]; amount_minor: number }>;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    features: JSON.parse(row.features_json) as string[],
    active: row.active === 1,
    sort_order: row.sort_order,
    starting_price_bdt_minor: row.starting_price_bdt_minor,
    starting_price_usd_minor: row.starting_price_usd_minor,
    starting_price_period: row.starting_price_period,
    prices: prices.filter((price) => price.product_id === row.id)
  }));
}

export function listAddons(includeInactive = false): CatalogAddon[] {
  assertCatalogReady();
  const rows = db.prepare(
    `SELECT id, slug, name, description, active FROM addons
     WHERE @includeInactive = 1 OR active = 1 ORDER BY name`
  ).all({ includeInactive: includeInactive ? 1 : 0 }) as Array<{
    id: string; slug: string; name: string; description: string; active: number;
  }>;
  const prices = db.prepare(
    `SELECT addon_id, currency, billing_period, amount_minor FROM addon_prices`
  ).all() as Array<{ addon_id: string; currency: CatalogPrice["currency"]; billing_period: CatalogPrice["billing_period"]; amount_minor: number }>;

  return rows.map((row) => ({
    ...row,
    active: row.active === 1,
    prices: prices.filter((price) => price.addon_id === row.id)
  }));
}

function upsertPrices(
  table: "product_prices" | "addon_prices",
  foreignKey: "product_id" | "addon_id",
  entityId: string,
  prices: CatalogPrice[]
) {
  const deleteStatement = db.prepare(`DELETE FROM ${table} WHERE ${foreignKey} = ?`);
  const insertStatement = db.prepare(
    `INSERT INTO ${table} (id, ${foreignKey}, currency, billing_period, amount_minor)
     VALUES (?, ?, ?, ?, ?)`
  );
  deleteStatement.run(entityId);
  for (const price of prices) {
    insertStatement.run(
      randomUUID(),
      entityId,
      price.currency,
      price.billing_period,
      price.amount_minor
    );
  }
}

export function saveProduct(input: {
  id?: string;
  name: string;
  category: CatalogProduct["category"];
  description: string;
  features: string[];
  active: boolean;
  sortOrder: number;
  startingPriceBdtMinor?: number | null;
  startingPriceUsdMinor?: number | null;
  startingPricePeriod?: CatalogPrice["billing_period"];
  prices: CatalogPrice[];
}, actorId?: string): string {
  assertCatalogReady();
  const id = input.id ?? randomUUID();
  const slug = slugify(input.name);
  if (!slug) throw new Error("Product name must contain letters or numbers.");

  const transaction = db.transaction(() => {
    if (input.id) {
      db.prepare(
        `UPDATE products SET slug = ?, name = ?, category = ?, description = ?,
         features_json = ?, active = ?, sort_order = ?, starting_price_bdt_minor = ?,
         starting_price_usd_minor = ?, starting_price_period = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(slug, input.name, input.category, input.description, JSON.stringify(input.features),
        input.active ? 1 : 0, input.sortOrder, input.startingPriceBdtMinor ?? null,
        input.startingPriceUsdMinor ?? null, input.startingPricePeriod ?? "monthly", id);
      if (!db.prepare("SELECT 1 FROM products WHERE id = ?").get(id)) {
        throw new Error("Product not found.");
      }
    } else {
      db.prepare(
        `INSERT INTO products
         (id, slug, name, category, description, features_json, active, sort_order,
          starting_price_bdt_minor, starting_price_usd_minor, starting_price_period)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, slug, input.name, input.category, input.description, JSON.stringify(input.features),
         input.active ? 1 : 0, input.sortOrder, input.startingPriceBdtMinor ?? null,
         input.startingPriceUsdMinor ?? null, input.startingPricePeriod ?? "monthly");
    }
    upsertPrices("product_prices", "product_id", id, input.prices);
    if (actorId) {
      db.prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, 'catalog.product_saved', 'product', ?, ?)`
      ).run(randomUUID(), actorId, id, JSON.stringify({
        name: input.name, active: input.active, priceCount: input.prices.length
      }));
    }
  });
  transaction();
  return id;
}

export function saveAddon(input: {
  id?: string;
  name: string;
  description: string;
  active: boolean;
  prices: CatalogPrice[];
}, actorId?: string): string {
  assertCatalogReady();
  const id = input.id ?? randomUUID();
  const slug = slugify(input.name);
  if (!slug) throw new Error("Add-on name must contain letters or numbers.");
  const transaction = db.transaction(() => {
    if (input.id) {
      db.prepare(
        `UPDATE addons SET slug = ?, name = ?, description = ?, active = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(slug, input.name, input.description, input.active ? 1 : 0, id);
      if (!db.prepare("SELECT 1 FROM addons WHERE id = ?").get(id)) {
        throw new Error("Add-on not found.");
      }
    } else {
      db.prepare("INSERT INTO addons (id, slug, name, description, active) VALUES (?, ?, ?, ?, ?)")
        .run(id, slug, input.name, input.description, input.active ? 1 : 0);
    }
    upsertPrices("addon_prices", "addon_id", id, input.prices);
    if (actorId) {
      db.prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, 'catalog.addon_saved', 'addon', ?, ?)`
      ).run(randomUUID(), actorId, id, JSON.stringify({
        name: input.name, active: input.active, priceCount: input.prices.length
      }));
    }
  });
  transaction();
  return id;
}

export function setProductActive(id: string, active: boolean, actorId?: string): boolean {
  assertCatalogReady();
  const updated = db.prepare(
    "UPDATE products SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(active ? 1 : 0, id).changes === 1;
  if (updated && actorId) {
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'catalog.product_status_changed', 'product', ?, ?)`
    ).run(randomUUID(), actorId, id, JSON.stringify({ active }));
  }
  return updated;
}

export function setAddonActive(id: string, active: boolean, actorId?: string): boolean {
  assertCatalogReady();
  const updated = db.prepare(
    "UPDATE addons SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(active ? 1 : 0, id).changes === 1;
  if (updated && actorId) {
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'catalog.addon_status_changed', 'addon', ?, ?)`
    ).run(randomUUID(), actorId, id, JSON.stringify({ active }));
  }
  return updated;
}
