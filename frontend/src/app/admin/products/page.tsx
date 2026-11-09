import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminCatalog } from "@/components/admin-catalog";
import { getStaffSession } from "@backend/admin-session";
import { listAddons, listProducts } from "@backend/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products & pricing", robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  if (!await getStaffSession("catalog.manage")) redirect("/admin");
  return (
    <div className="page-shell admin-shell">
      <section className="admin-heading">
        <div><p className="eyebrow"><span className="status-dot" /> CATALOG MANAGEMENT</p><h1>Plans with<br /><em>clear terms.</em></h1></div>
        <p>Choose a category to see exactly which public page will show the product. Set only approved prices; unconfigured prices remain quote-only.</p>
      </section>
      <section className="admin-content"><AdminCatalog products={listProducts(undefined, true)} addons={listAddons(true)} /></section>
    </div>
  );
}
