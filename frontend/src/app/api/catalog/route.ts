import { NextResponse } from "next/server";
import { listAddons, listProducts } from "@backend/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    products: listProducts("hosting"),
    addons: listAddons()
  });
}
