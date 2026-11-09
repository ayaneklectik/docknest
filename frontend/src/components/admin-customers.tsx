"use client";

import { useState } from "react";
import type { CustomerRecord } from "@backend/sales";

export function AdminCustomers({ customers: initialCustomers }: { customers: CustomerRecord[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [notice, setNotice] = useState("");

  async function saveCustomer(customer: CustomerRecord, form: FormData) {
    const updated = {
      name: String(form.get("name") ?? ""),
      company: String(form.get("company") ?? ""),
      phone: String(form.get("phone") ?? ""),
      country: String(form.get("country") ?? ""),
      notes: String(form.get("notes") ?? "")
    };
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Customer could not be updated.");
        return;
      }
      setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, ...updated, company: updated.company || null, phone: updated.phone || null, country: updated.country || null } : item));
      setNotice(`Saved changes for ${updated.name}.`);
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      {customers.length === 0 ? <p className="empty-state">No customers match this search. Customer records are created from submitted quotation requests.</p> : (
        <div className="customer-list">{customers.map((customer) => (
          <details className="customer-card" key={customer.id}>
            <summary><span><strong>{customer.name}</strong><span className="table-detail">{customer.email}{customer.company ? ` · ${customer.company}` : ""}</span></span><span>{customer.order_count} orders · {customer.quote_count} quotations</span></summary>
            <form onSubmit={(event) => { event.preventDefault(); void saveCustomer(customer, new FormData(event.currentTarget)); }}>
              <label>Name<input name="name" defaultValue={customer.name} required minLength={2} maxLength={100} /></label>
              <label>Company<input name="company" defaultValue={customer.company ?? ""} maxLength={120} /></label>
              <label>Phone<input name="phone" defaultValue={customer.phone ?? ""} maxLength={40} /></label>
              <label>Country<input name="country" defaultValue={customer.country ?? ""} maxLength={100} /></label>
              <label className="customer-notes">Internal notes<textarea name="notes" defaultValue={customer.notes} maxLength={4000} rows={3} /></label>
              <p className="table-detail">Added {new Date(customer.created_at).toLocaleDateString()}</p>
              <button className="small-action" type="submit">Save customer</button>
            </form>
          </details>
        ))}</div>
      )}
    </>
  );
}
