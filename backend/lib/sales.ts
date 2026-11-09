import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";
import { enqueueEmail } from "@backend/email";
import type { QuoteStatus } from "@/lib/quote";

type QuoteLineInput = {
  id?: string;
  description: string;
  quantity: number;
  unitAmountMinor: number;
};

export type OrderRecord = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  email: string;
  quote_id: string | null;
  status: "awaiting_payment" | "payment_review" | "paid" | "cancelled" | "refunded";
  currency: "BDT" | "USD";
  total_minor: number;
  paid_minor: number;
  created_at: string;
  invoice_number: string | null;
};

export type PaymentRecord = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  method: "manual_bank" | "manual_mobile" | "card_gateway" | "other";
  reference: string;
  amount_minor: number;
  currency: "BDT" | "USD";
  status: "pending_review" | "approved" | "rejected";
  created_at: string;
  reviewer_note: string;
};

function assertReady() {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }
}

export function updateQuoteProposal(
  id: string,
  proposal: {
    currency: "BDT" | "USD";
    note: string;
    expiresAt: string | null;
    items: QuoteLineInput[];
  },
  actorId: string
): boolean {
  assertReady();
  const total = proposal.items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountMinor,
    0
  );
  if (!Number.isSafeInteger(total)) throw new Error("Quotation total is too large.");

  const save = db.transaction(() => {
    const quote = db.prepare("SELECT status, email, name FROM quote_requests WHERE id = ?").get(id) as { status: QuoteStatus; email: string; name: string } | undefined;
    if (!quote || quote.status === "converted" || quote.status === "rejected") return false;
    const existingItems = new Map((db.prepare(
      `SELECT id, product_id, addon_id, billing_period FROM quote_items WHERE quote_id = ?`
    ).all(id) as Array<{
      id: string; product_id: string | null; addon_id: string | null;
      billing_period: "monthly" | "yearly" | "two-year" | "three-year" | "one-time";
    }>).map((item) => [item.id, item]));
    db.prepare("DELETE FROM quote_items WHERE quote_id = ?").run(id);
    const insert = db.prepare(
      `INSERT INTO quote_items
       (id, quote_id, product_id, addon_id, description, quantity, unit_amount_minor, currency, billing_period)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(
         (SELECT billing_period FROM quote_requests WHERE id = ?), 'one-time'
       ))`
    );
    for (const item of proposal.items) {
      const existing = item.id ? existingItems.get(item.id) : undefined;
      insert.run(
        existing?.id ?? randomUUID(), id, existing?.product_id ?? null,
        existing?.addon_id ?? null, item.description, item.quantity,
        item.unitAmountMinor, proposal.currency, id
      );
    }
    db.prepare(
      `UPDATE quote_requests
       SET status = 'quoted', currency = ?, quoted_total_minor = ?, admin_note = ?,
           quote_expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(proposal.currency, total, proposal.note, proposal.expiresAt, id);
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'quote.proposed', 'quote', ?, ?)`
    ).run(randomUUID(), actorId, id, JSON.stringify({ currency: proposal.currency, total }));
    enqueueEmail(
      quote.email,
      "A Docknest quotation is ready",
      `Hello ${quote.name},\n\nA quotation has been prepared for your Docknest request. Our team will follow up through the contact details you supplied.\n\nQuoted amount: ${proposal.currency} ${total} minor units.\n${proposal.note ? `\nNote: ${proposal.note}\n` : ""}\nThis email is a notification only.`
    );
    return true;
  });
  return save();
}

export function convertApprovedQuoteToOrder(quoteId: string, actorId: string): string {
  assertReady();
  const convert = db.transaction(() => {
    const quote = db.prepare(
      `SELECT id, customer_id, status, currency, quoted_total_minor
       FROM quote_requests WHERE id = ?`
    ).get(quoteId) as {
      id: string; customer_id: string | null; status: QuoteStatus;
      currency: "BDT" | "USD" | null; quoted_total_minor: number | null;
    } | undefined;
    if (!quote) throw new Error("Quotation not found.");
    if (quote.status !== "approved") throw new Error("Only an approved quotation can be converted.");
    if (!quote.customer_id || !quote.currency || quote.quoted_total_minor === null) {
      throw new Error("Quotation needs a customer and a saved price before conversion.");
    }
    const items = db.prepare(
      `SELECT product_id, addon_id, description, quantity, unit_amount_minor, billing_period
       FROM quote_items WHERE quote_id = ?`
    ).all(quoteId) as Array<{
      product_id: string | null; addon_id: string | null;
      description: string; quantity: number; unit_amount_minor: number;
      billing_period: "monthly" | "yearly" | "two-year" | "three-year" | "one-time";
    }>;
    if (items.length === 0) throw new Error("Quotation must contain at least one priced line item.");
    const computedTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_amount_minor, 0);
    if (computedTotal !== quote.quoted_total_minor) {
      throw new Error("Quotation line items do not match the saved total.");
    }

    const orderId = randomUUID();
    const orderNumber = `DN-${new Date().toISOString().slice(2, 7).replace("-", "")}-${randomUUID().slice(0, 12).toUpperCase()}`;
    db.prepare(
      `INSERT INTO orders (id, order_number, customer_id, quote_id, currency, total_minor)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(orderId, orderNumber, quote.customer_id, quoteId, quote.currency, quote.quoted_total_minor);

    const insertOrderItem = db.prepare(
      `INSERT INTO order_items
       (id, order_id, product_id, addon_id, description, quantity, unit_amount_minor, billing_period)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of items) {
      insertOrderItem.run(
        randomUUID(), orderId, item.product_id, item.addon_id, item.description,
        item.quantity, item.unit_amount_minor, item.billing_period
      );
    }

    const invoiceId = randomUUID();
    const invoiceNumber = `INV-${new Date().toISOString().slice(2, 7).replace("-", "")}-${randomUUID().slice(0, 12).toUpperCase()}`;
    db.prepare(
      `INSERT INTO invoices
       (id, invoice_number, order_id, currency, subtotal_minor, total_minor)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(invoiceId, invoiceNumber, orderId, quote.currency, quote.quoted_total_minor, quote.quoted_total_minor);
    db.prepare(
      "UPDATE quote_requests SET status = 'converted', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(quoteId);
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'quote.converted', 'quote', ?, ?)`
    ).run(randomUUID(), actorId, quoteId, JSON.stringify({ orderId, orderNumber, invoiceId }));
    return orderId;
  });
  return convert();
}

export function listOrders(search = ""): OrderRecord[] {
  assertReady();
  const term = `%${search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  return db.prepare(
    `SELECT o.id, o.order_number, o.customer_id, c.name AS customer_name, c.email,
            o.quote_id, o.status, o.currency, o.total_minor,
            COALESCE((SELECT SUM(p.amount_minor) FROM payments p
              WHERE p.order_id = o.id AND p.status = 'approved'), 0) AS paid_minor,
            o.created_at, i.invoice_number
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN invoices i ON i.order_id = o.id
     WHERE o.order_number LIKE @term ESCAPE '\\'
        OR c.name LIKE @term ESCAPE '\\'
        OR c.email LIKE @term ESCAPE '\\'
     ORDER BY o.created_at DESC LIMIT 200`
  ).all({ term }) as OrderRecord[];
}

export function updateOrderStatus(
  id: string,
  status: "awaiting_payment" | "cancelled",
  actorId: string
): boolean {
  assertReady();
  const update = db.transaction(() => {
    if (status === "cancelled") {
      const blockingPayment = db.prepare(
        `SELECT 1 FROM payments WHERE order_id = ? AND status IN ('pending_review', 'approved') LIMIT 1`
      ).get(id);
      if (blockingPayment) return false;
    }
    const changed = db.prepare(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status IN ('awaiting_payment', 'payment_review')`
    ).run(status, id);
    if (changed.changes !== 1) return false;
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'order.status_changed', 'order', ?, ?)`
    ).run(randomUUID(), actorId, id, JSON.stringify({ status }));
    return true;
  });
  return update();
}

export function submitManualPayment(input: {
  orderNumber: string;
  email: string;
  phone: string;
  method: "manual_bank" | "manual_mobile" | "other";
  reference: string;
  amountMinor: number;
}): string {
  assertReady();
  const submit = db.transaction(() => {
    const order = db.prepare(
      `SELECT o.id, o.status, o.currency, o.total_minor, c.id AS customer_id, c.email,
         COALESCE((SELECT SUM(p.amount_minor) FROM payments p
          WHERE p.order_id = o.id AND p.status IN ('approved', 'pending_review')), 0) AS reserved_minor
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.order_number = ?`
    ).get(input.orderNumber) as {
      id: string; status: string; currency: "BDT" | "USD";
      total_minor: number; customer_id: string; email: string; reserved_minor: number;
    } | undefined;
    if (!order || order.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new Error("Order number and customer email did not match.");
    }
    if (!["awaiting_payment", "payment_review"].includes(order.status)) {
      throw new Error("This order is not accepting payment submissions.");
    }
    if (input.amountMinor <= 0 || input.amountMinor + order.reserved_minor > order.total_minor) {
      throw new Error("Payment amount exceeds the outstanding order balance.");
    }

    db.prepare(
      "UPDATE customers SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(input.phone, order.customer_id);
    const id = randomUUID();
    db.prepare(
      `INSERT INTO payments (id, order_id, method, reference, amount_minor, currency)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, order.id, input.method, input.reference, input.amountMinor, order.currency);
    enqueueEmail(
      input.email,
      "Docknest received your payment details",
      `We recorded your manual payment details for order ${input.orderNumber} for administrator review. This is not a confirmation of payment or service activation.`
    );
    db.prepare(
      "UPDATE orders SET status = 'payment_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(order.id);
    return id;
  });
  return submit();
}

export function listPayments(): PaymentRecord[] {
  assertReady();
  return db.prepare(
    `SELECT p.id, o.order_number, c.name AS customer_name, c.email,
            p.method, p.reference, p.amount_minor, p.currency, p.status,
            p.created_at, p.reviewer_note
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN customers c ON c.id = o.customer_id
     ORDER BY CASE p.status WHEN 'pending_review' THEN 0 ELSE 1 END, p.created_at DESC
     LIMIT 300`
  ).all() as PaymentRecord[];
}

export function reviewPayment(
  id: string,
  status: "approved" | "rejected",
  note: string,
  reviewerId: string
): boolean {
  assertReady();
  const review = db.transaction(() => {
    const payment = db.prepare(
      `SELECT p.id, p.order_id, p.amount_minor, p.status, c.email, c.name, o.order_number,
              o.total_minor, o.currency, o.status AS order_status,
              COALESCE((SELECT SUM(other.amount_minor) FROM payments other
                WHERE other.order_id = p.order_id AND other.status = 'approved'), 0) AS approved_minor
       FROM payments p JOIN orders o ON o.id = p.order_id
       JOIN customers c ON c.id = o.customer_id WHERE p.id = ?`
    ).get(id) as {
      id: string; order_id: string; amount_minor: number; status: string;
      total_minor: number; currency: "BDT" | "USD"; approved_minor: number;
      email: string; name: string; order_number: string; order_status: string;
    } | undefined;
    if (!payment || payment.status !== "pending_review") return false;
    if (payment.order_status === "cancelled") {
      throw new Error("Order is cancelled and cannot accept a payment review.");
    }
    if (status === "approved" && payment.approved_minor + payment.amount_minor > payment.total_minor) {
      throw new Error("Approving this payment would exceed the outstanding order balance.");
    }

    db.prepare(
      `UPDATE payments SET status = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP,
       reviewer_note = ? WHERE id = ?`
    ).run(status, reviewerId, note, id);

    const approvedTotal = payment.approved_minor + (status === "approved" ? payment.amount_minor : 0);
    if (status === "approved" && approvedTotal >= payment.total_minor) {
      db.prepare("UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(payment.order_id);
      db.prepare("UPDATE invoices SET status = 'paid' WHERE order_id = ? AND status = 'issued'")
        .run(payment.order_id);
    } else {
      const pending = db.prepare(
        "SELECT COUNT(*) AS count FROM payments WHERE order_id = ? AND status = 'pending_review'"
      ).get(payment.order_id) as { count: number };
      db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(pending.count > 0 ? "payment_review" : "awaiting_payment", payment.order_id);
    }
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, ?, 'payment', ?, ?)`
    ).run(randomUUID(), reviewerId, `payment.${status}`, id, JSON.stringify({
      amountMinor: payment.amount_minor,
      orderId: payment.order_id,
      note
    }));
    enqueueEmail(
      payment.email,
      `Docknest payment submission ${status}`,
      `Hello ${payment.name},\n\nYour manual payment submission for order ${payment.order_number} was ${status} by our team.\n${note ? `\nReview note: ${note}\n` : ""}\nOrder balance and invoice records were updated as applicable. Service activation is a separate process and is not automatic.`
    );
    return true;
  });
  return review();
}

export function listInvoices() {
  assertReady();
  return db.prepare(
    `SELECT i.id, i.invoice_number, o.order_number, c.name AS customer_name,
            c.email, i.status, i.currency, i.subtotal_minor, i.total_minor,
            i.due_at, i.created_at
     FROM invoices i JOIN orders o ON o.id = i.order_id
     JOIN customers c ON c.id = o.customer_id
     ORDER BY i.created_at DESC LIMIT 300`
  ).all() as Array<{
    id: string; invoice_number: string; order_number: string; customer_name: string;
    email: string; status: "issued" | "paid" | "void"; currency: "BDT" | "USD";
    subtotal_minor: number; total_minor: number; due_at: string | null; created_at: string;
  }>;
}

export function voidInvoice(id: string, actorId: string): boolean {
  assertReady();
  const voidIt = db.transaction(() => {
    const invoice = db.prepare(
      `SELECT i.order_id FROM invoices i
       WHERE i.id = ? AND i.status = 'issued'
         AND NOT EXISTS (
           SELECT 1 FROM payments p
           WHERE p.order_id = i.order_id AND p.status IN ('pending_review', 'approved')
         )`
    ).get(id) as { order_id: string } | undefined;
    if (!invoice) return false;
    const updated = db.prepare("UPDATE invoices SET status = 'void' WHERE id = ? AND status = 'issued'").run(id);
    if (updated.changes !== 1) return false;
    db.prepare(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status IN ('awaiting_payment', 'payment_review')`
    ).run(invoice.order_id);
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'invoice.voided', 'invoice', ?, '{}')`
    ).run(randomUUID(), actorId, id);
    return true;
  });
  return voidIt();
}

export function listCustomers(search = "") {
  assertReady();
  const term = `%${search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  return db.prepare(
    `SELECT c.id, c.name, c.email, c.company, c.phone, c.country, c.notes,
            c.created_at, COUNT(DISTINCT o.id) AS order_count,
            COUNT(DISTINCT q.id) AS quote_count
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     LEFT JOIN quote_requests q ON q.customer_id = c.id
     WHERE c.name LIKE @term ESCAPE '\\' OR c.email LIKE @term ESCAPE '\\'
        OR COALESCE(c.company, '') LIKE @term ESCAPE '\\'
     GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500`
  ).all({ term }) as Array<{
    id: string; name: string; email: string; company: string | null;
    phone: string | null; country: string | null; notes: string;
    created_at: string; order_count: number; quote_count: number;
  }>;
}

export type CustomerRecord = ReturnType<typeof listCustomers>[number];

export function updateCustomer(
  id: string,
  input: Pick<CustomerRecord, "name" | "company" | "phone" | "country" | "notes">,
  actorId: string
): boolean {
  assertReady();
  const updated = db.prepare(
    `UPDATE customers SET name = ?, company = ?, phone = ?, country = ?, notes = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(input.name, input.company, input.phone, input.country, input.notes, id);
  if (updated.changes === 1) {
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'customer.updated', 'customer', ?, '{}')`
    ).run(randomUUID(), actorId, id);
  }
  return updated.changes === 1;
}

export function getSalesAnalytics() {
  assertReady();
  const counts = db.prepare(
    `SELECT (SELECT COUNT(*) FROM customers) AS customers,
       (SELECT COUNT(*) FROM quote_requests) AS quotations,
       (SELECT COUNT(*) FROM orders) AS orders,
       (SELECT COUNT(*) FROM payments WHERE status = 'pending_review') AS pending_payments,
       (SELECT COUNT(*) FROM support_tickets WHERE status NOT IN ('resolved', 'closed')) AS open_tickets`
  ).get() as { customers: number; quotations: number; orders: number; pending_payments: number; open_tickets: number };
  const revenue = db.prepare(
    `SELECT currency, SUM(amount_minor) AS total_minor
     FROM payments WHERE status = 'approved' GROUP BY currency`
  ).all() as Array<{ currency: "BDT" | "USD"; total_minor: number }>;
  return { ...counts, revenue };
}
