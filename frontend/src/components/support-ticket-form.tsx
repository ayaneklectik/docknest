"use client";

import { FormEvent, useState } from "react";

export function SupportTicketForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          subject: form.get("subject"),
          body: form.get("body"),
          website: form.get("website")
        })
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Your request could not be submitted.");
        return;
      }
      setMessage(result.message ?? "Your support request has been received.");
      element.reset();
    } catch {
      setMessage("A network error interrupted your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="quote-form support-ticket-form" onSubmit={submit}>
    <label>Name<input name="name" minLength={2} maxLength={100} required autoComplete="name" /></label>
    <label>Email<input name="email" type="email" maxLength={254} required autoComplete="email" /></label>
    <label>Contact number<input name="phone" type="tel" minLength={7} maxLength={40} required autoComplete="tel" /></label>
    <label>Subject<input name="subject" minLength={4} maxLength={180} required /></label>
    <label>How can we help?<textarea name="body" minLength={10} maxLength={5000} rows={6} required /></label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Sending…" : "Create support ticket"}</button>
    <p className="form-message" aria-live="polite" role="status">{message}</p>
  </form>;
}
