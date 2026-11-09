"use client";

import { FormEvent, useState } from "react";

const services = [
  "Shared hosting",
  "Business hosting",
  "Managed VPS",
  "E-commerce hosting",
  "Custom hosting",
  "Website development",
  "Web application",
  "Custom software and API",
  "Website maintenance",
  "Domain registration",
  "General enquiry"
];

type QuoteFormProps = {
  initialService?: string;
  initialRequirements?: string;
};

export function QuoteForm({
  initialService = "Shared hosting",
  initialRequirements = ""
}: QuoteFormProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      company: String(form.get("company") ?? ""),
      service: String(form.get("service") ?? ""),
      billingPeriod: String(form.get("billingPeriod") ?? "") || undefined,
      requirements: String(form.get("requirements") ?? ""),
      website: String(form.get("website") ?? "")
    };

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "We could not submit your request. Please try again.");
        return;
      }
      formElement.reset();
      setMessage(result.message ?? "Thanks. Your request has been received.");
    } catch {
      setMessage("A network error interrupted your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="quote-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Your name <span aria-hidden="true">*</span>
          <input name="name" autoComplete="name" minLength={2} maxLength={100} required />
        </label>
        <label>
          Work email <span aria-hidden="true">*</span>
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          Contact number <span aria-hidden="true">*</span>
          <input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={40} required />
        </label>
        <label>
          Business or project
          <input name="company" autoComplete="organization" maxLength={120} />
        </label>
        <label>
          I am interested in <span aria-hidden="true">*</span>
          <select name="service" defaultValue={initialService} required>
            {services.map((service) => <option key={service}>{service}</option>)}
          </select>
        </label>
        <label>
          Preferred billing
          <select name="billingPeriod" defaultValue="">
            <option value="">Not sure yet</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="two-year">Two years</option>
            <option value="three-year">Three years</option>
          </select>
        </label>
        <label className="form-wide">
          Tell us what you need <span aria-hidden="true">*</span>
          <textarea
            name="requirements"
            rows={5}
            minLength={10}
            maxLength={3000}
            defaultValue={initialRequirements}
            placeholder="Share your goals, requirements, expected traffic, timeline, or questions."
            required
          />
        </label>
        <label className="honeypot" aria-hidden="true">
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="form-submit">
        <button className="button button-dark" type="submit" disabled={submitting}>
          {submitting ? "Sending request…" : "Send quote request"} <span aria-hidden="true">↗</span>
        </button>
        <p>We’ll follow up personally. No payment is taken with this request.</p>
      </div>
      <p className="form-message" aria-live="polite" role="status">{message}</p>
    </form>
  );
}
