"use client";

import { FormEvent, useState } from "react";

export function PaymentSubmissionForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: form.get("orderNumber"),
          email: form.get("email"),
          phone: form.get("phone"),
          method: form.get("method"),
          reference: form.get("reference"),
          amountMinor: Number(form.get("amountMinor"))
        })
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Payment submission failed.");
        return;
      }
      setMessage(result.message ?? "Payment details submitted for review.");
      formElement.reset();
    } catch {
      setMessage("A network error interrupted your submission. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="quote-form" onSubmit={submit}>
    <label>Order number<input name="orderNumber" minLength={8} maxLength={60} required /></label>
    <label>Customer email<input name="email" type="email" maxLength={254} required /></label>
    <label>Contact number<input name="phone" type="tel" minLength={7} maxLength={40} required autoComplete="tel" /></label>
    <label>Payment method<select name="method"><option value="manual_bank">Bank transfer</option><option value="manual_mobile">Mobile financial service</option><option value="other">Other manual method</option></select></label>
    <label>Transfer reference<input name="reference" minLength={2} maxLength={160} required /></label>
    <label>Amount in minor currency units<input name="amountMinor" type="number" min="1" step="1" required /><span className="muted-copy">BDT is entered in taka; USD is entered in cents. The order determines its currency.</span></label>
    <button className="button button-dark" disabled={busy} type="submit">{busy ? "Submitting…" : "Submit for manual review"}</button>
    <p className="form-message" aria-live="polite" role="status">{message}</p>
  </form>;
}
