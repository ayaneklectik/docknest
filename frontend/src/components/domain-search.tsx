"use client";

import { FormEvent, useState } from "react";

const extensions = [".com", ".net", ".org", ".com.bd", ".bd"];
const domainPattern = /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

type DomainStatus = "available" | "unavailable" | "manual_check_required";
type DomainLookup = {
  domain: string;
  status: DomainStatus;
  message: string;
  reference: string | null;
};

export function DomainSearch({ initialName = "" }: { initialName?: string }) {
  const [name, setName] = useState(initialName);
  const [lookup, setLookup] = useState<DomainLookup | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"search" | "request" | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const domain = name.trim().toLowerCase();
    if (!domainPattern.test(domain)) {
      setLookup(null);
      setNotice("Enter a complete domain name, such as youridea.com.");
      return;
    }

    setName(domain);
    setLookup(null);
    setNotice("");
    setRequestSent(false);
    setBusy("search");
    try {
      const response = await fetch(`/api/domains?domain=${encodeURIComponent(domain)}`);
      const result = await response.json() as DomainLookup & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The domain could not be checked.");
      setLookup(result);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The domain could not be checked.");
    } finally {
      setBusy(null);
    }
  }

  async function requestDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lookup) return;
    const form = new FormData(event.currentTarget);
    setNotice("");
    setBusy("request");
    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: lookup.domain,
          name: form.get("contactName"),
          email: form.get("email"),
          phone: form.get("phone")
        })
      });
      const result = await response.json() as {
        status?: DomainStatus;
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Your request could not be saved.");
      if (result.status && result.message) {
        setLookup({ ...lookup, status: result.status, message: result.message });
      }
      setRequestSent(true);
      setNotice(result.message ?? "Your request has been recorded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your request could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  function appendExtension(extension: string) {
    const base = name.trim().replace(/\.[a-z0-9.-]+$/i, "");
    setName(`${base}${extension}`);
    setLookup(null);
    setNotice("");
    setRequestSent(false);
  }

  const resultTitle = lookup?.status === "available"
    ? "Looks available"
    : lookup?.status === "unavailable"
      ? "Already registered"
      : "Manual check needed";

  return (
    <div className="domain-search">
      <form className="domain-search-form" onSubmit={search}>
        <label htmlFor="domain-name">Domain name</label>
        <div className="domain-input-row">
          <input
            id="domain-name"
            name="domain"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setLookup(null);
              setNotice("");
              setRequestSent(false);
            }}
            placeholder="youridea.com"
            autoComplete="url"
            maxLength={253}
            required
          />
          <button className="button button-dark" type="submit" disabled={busy !== null}>
            {busy === "search" ? "Checking…" : "Check domain"}
            <span aria-hidden="true">⌕</span>
          </button>
        </div>
      </form>

      <div className="extension-row" aria-label="Suggested domain extensions">
        <span>Suggestions</span>
        {extensions.map((extension) => (
          <button key={extension} type="button" onClick={() => appendExtension(extension)}>{extension}</button>
        ))}
      </div>

      {notice && !requestSent && <p className="domain-error" role="alert">{notice}</p>}

      {lookup && (
        <div className={`domain-result domain-result-${lookup.status}`} role="status">
          <span className="result-mark" aria-hidden="true">
            {lookup.status === "available" ? "✓" : lookup.status === "unavailable" ? "×" : "?"}
          </span>
          <div>
            <strong>{resultTitle}</strong>
            <p>{lookup.message}</p>
            {requestSent && <p className="domain-request-confirmation">Request received. We’ll follow up using your contact details.</p>}
          </div>
        </div>
      )}

      {lookup && lookup.status !== "unavailable" && !requestSent && (
        <form className="domain-request-form" onSubmit={requestDomain}>
          <p>{lookup.status === "available"
            ? "Want Docknest to help secure it? Leave your contact details and we’ll confirm the final registration price."
            : "Want us to check this extension for you? Leave your contact details and our team will follow up."}</p>
          <div className="domain-contact-fields">
            <label htmlFor="domain-contact-name">Your name</label>
            <input id="domain-contact-name" name="contactName" autoComplete="name" minLength={2} maxLength={100} required />
            <label htmlFor="domain-contact-email">Email</label>
            <input id="domain-contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
            <label htmlFor="domain-contact-phone">Contact number</label>
            <input id="domain-contact-phone" name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={40} required />
          </div>
          <button className="button button-dark" type="submit" disabled={busy !== null}>
            {busy === "request" ? "Sending request…" : "Ask Docknest to help"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>
      )}
    </div>
  );
}
