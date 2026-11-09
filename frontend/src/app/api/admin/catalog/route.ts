import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { billingPeriods, currencies, listAddons, listProducts, productCategories, saveAddon, saveProduct } from "@backend/catalog";

const priceSchema = z.object({
  currency: z.enum(currencies),
  billing_period: z.enum(billingPeriods),
  amount_minor: z.number().int().min(0).max(100_000_000_000)
});

const productSchema = z.object({
  type: z.literal("product"),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  category: z.enum(productCategories),
  description: z.string().trim().max(1000).default(""),
  features: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  startingPriceBdtMinor: z.number().int().min(0).max(100_000_000_000).nullable().optional().default(null),
  startingPriceUsdMinor: z.number().int().min(0).max(100_000_000_000).nullable().optional().default(null),
  startingPricePeriod: z.enum(billingPeriods).default("monthly"),
  prices: z.array(priceSchema).max(20).default([])
});

const addonSchema = z.object({
  type: z.literal("addon"),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
  active: z.boolean().default(true),
  prices: z.array(priceSchema).max(20).default([])
});

export async function GET(request: Request) {
  const session = await getStaffSession("catalog.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
  return NextResponse.json({
    products: listProducts(undefined, includeInactive),
    addons: listAddons(includeInactive)
  });
}

export async function POST(request: Request) {
  const session = await getStaffSession("catalog.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const product = productSchema.safeParse(body);
  if (product.success) {
    try {
      const id = saveProduct(product.data, session.user.id);
      return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (error) {
      console.error("Product could not be saved.", error);
      return NextResponse.json({ error: "Product could not be saved. Check for duplicate names." }, { status: 400 });
    }
  }
  const addon = addonSchema.safeParse(body);
  if (addon.success) {
    try {
      const id = saveAddon(addon.data, session.user.id);
      return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (error) {
      console.error("Add-on could not be saved.", error);
      return NextResponse.json({ error: "Add-on could not be saved. Check for duplicate names." }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Invalid product or add-on data." }, { status: 400 });
}
