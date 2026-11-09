"use client";

import { useState } from "react";
import type { OrderRecord, PaymentRecord } from "@backend/sales";

export function AdminOrders({ orders: initialOrders }: { orders: OrderRecord[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [notice, setNotice] = useState("");

  async function cancelOrder(order: OrderRecord) {
    setNotice("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      });
      if (!response.ok) {
        setNotice("Order could not be cancelled.");
        return;
      }
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: "cancelled" } : item));
      setNotice("Order cancelled.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      {orders.length === 0 ? <p className="empty-state">No orders yet. Convert an approved quotation to create an order and invoice.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Paid</th><th>Status</th><th>Invoice</th></tr></thead>
          <tbody>{orders.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.order_number}</strong><span className="table-detail">{new Date(order.created_at).toLocaleDateString()}</span></td>
              <td>{order.customer_name}<a className="table-detail" href={`mailto:${order.email}`}>{order.email}</a></td>
              <td>{order.currency} {order.total_minor} <span className="table-detail">minor units</span></td>
              <td>{order.currency} {order.paid_minor}</td>
              <td><span className={`status-pill status-${order.status}`}>{order.status.replaceAll("_", " ")}</span>{["awaiting_payment", "payment_review"].includes(order.status) && <button className="small-action" onClick={() => void cancelOrder(order)} type="button">Cancel order</button>}</td>
              <td>{order.invoice_number ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <p className="pricing-note">An order being paid does not activate or provision a hosting service.</p>
    </>
  );
}

export function AdminPayments({ payments: initialPayments }: { payments: PaymentRecord[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [notice, setNotice] = useState("");

  async function review(payment: PaymentRecord, status: "approved" | "rejected") {
    setNotice("");
    try {
      const response = await fetch(`/api/admin/payments/${payment.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: "" })
      });
      const result = await response.json() as { error?: string; serviceProvisioned?: boolean };
      if (!response.ok) {
        setNotice(result.error ?? "Payment review failed.");
        return;
      }
      setPayments((current) => current.map((item) => item.id === payment.id ? { ...item, status } : item));
      setNotice(status === "approved"
        ? `Payment approved. The order balance has been updated. Service provisioned: ${String(result.serviceProvisioned)}.`
        : "Payment rejected; the customer may submit corrected details.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      {payments.length === 0 ? <p className="empty-state">No payment submissions yet. Customers can submit manual payment references from the payment page.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Order / customer</th><th>Method / reference</th><th>Amount</th><th>Status</th><th>Manual review</th></tr></thead>
          <tbody>{payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.order_number}<span className="table-detail">{payment.customer_name} · {payment.email}</span></td>
              <td>{payment.method.replaceAll("_", " ")}<span className="table-detail">{payment.reference}</span></td>
              <td>{payment.currency} {payment.amount_minor} <span className="table-detail">minor units</span></td>
              <td><span className={`status-pill status-${payment.status}`}>{payment.status.replaceAll("_", " ")}</span></td>
              <td>{payment.status === "pending_review" ? <div className="action-group">
                <button className="small-action" onClick={() => void review(payment, "approved")} type="button">Approve payment</button>
                <button className="small-action danger-action" onClick={() => void review(payment, "rejected")} type="button">Reject</button>
              </div> : "Reviewed"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <p className="pricing-note">Approval updates the order/invoice balance only. It never provisions or activates a service.</p>
    </>
  );
}

export function AdminInvoices({ invoices: initialInvoices }: {
  invoices: Array<{
    id: string; invoice_number: string; order_number: string; customer_name: string;
    email: string; status: "issued" | "paid" | "void"; currency: "BDT" | "USD";
    subtotal_minor: number; total_minor: number; due_at: string | null; created_at: string;
  }>;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [notice, setNotice] = useState("");

  async function voidInvoice(id: string) {
    try {
      const response = await fetch(`/api/admin/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "void" })
      });
      if (!response.ok) {
        setNotice("Invoice could not be voided.");
        return;
      }
      setInvoices((current) => current.map((invoice) => invoice.id === id ? { ...invoice, status: "void" } : invoice));
      setNotice("Invoice voided.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      {invoices.length === 0 ? <p className="empty-state">Invoices are created when an approved quotation is converted into an order.</p> : (
        <div className="table-scroll"><table className="admin-table">
          <thead><tr><th>Invoice</th><th>Order / customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td><strong>{invoice.invoice_number}</strong><span className="table-detail">{new Date(invoice.created_at).toLocaleDateString()}</span></td>
              <td>{invoice.order_number}<span className="table-detail">{invoice.customer_name} · {invoice.email}</span></td>
              <td>{invoice.currency} {invoice.total_minor} <span className="table-detail">minor units</span></td>
              <td><span className={`status-pill status-${invoice.status}`}>{invoice.status}</span></td>
              <td>{invoice.status === "issued" ? <button className="small-action danger-action" onClick={() => void voidInvoice(invoice.id)} type="button">Void unpaid invoice</button> : "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
