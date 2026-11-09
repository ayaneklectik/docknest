import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminCustomers } from "@/components/admin-customers";
import { getStaffSession } from "@backend/admin-session";
import { listCustomers } from "@backend/sales";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };

export default async function CustomersPage({ searchParams }: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!await getStaffSession("customers.manage")) redirect("/admin");
  const query = (await searchParams).q?.slice(0, 100) ?? "";
  const customers = listCustomers(query);
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">CUSTOMER RELATIONSHIPS</p><h1>People behind<br /><em>every project.</em></h1></div><p>Customer details stay connected to their quotations, orders, and support history. Records are not hard-deleted.</p></section>
    <section className="admin-content">
      <div className="admin-section-heading"><div className="section-kicker">Customer records</div><h2>Customers <span>{customers.length}</span></h2></div>
      <form className="customer-search" action="/admin/customers" method="get"><label htmlFor="customer-search">Search name, email, or company</label><div><input id="customer-search" name="q" defaultValue={query} maxLength={100} /><button className="small-action" type="submit">Search</button></div></form>
      <AdminCustomers customers={customers} />
    </section>
  </div>;
}
