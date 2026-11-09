"use client";

import { useState } from "react";
import type { QuoteRecord } from "@backend/quotes";
import { quoteStatuses, type QuoteStatus } from "@/lib/quote";

type ProposalLine = { id?: string; description: string; quantity: string; unitAmountMinor: string };
type ProposalDraft = { currency: "BDT" | "USD"; note: string; items: ProposalLine[] };

function createDraft(quote: QuoteRecord): ProposalDraft {
  const items = quote.line_items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: String(item.quantity),
    unitAmountMinor: String(item.unit_amount_minor)
  }));
  return {
    currency: quote.currency ?? "BDT",
    note: quote.admin_note ?? "",
    items: items.length > 0 ? items : [{
      description: quote.service,
      quantity: "1",
      unitAmountMinor: String(quote.estimate_total_minor ?? 0)
    }]
  };
}

export function AdminQuotesTable({ quotes }: { quotes: QuoteRecord[] }) {
  const [items, setItems] = useState(quotes);
  const [notice, setNotice] = useState("");
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, ProposalDraft>>(
    () => Object.fromEntries(quotes.map((quote) => [quote.id, createDraft(quote)]))
  );

  function setDraftCurrency(id: string, currency: "BDT" | "USD") {
    setProposalDrafts((current) => ({ ...current, [id]: { ...current[id], currency } }));
  }

  function setDraftNote(id: string, note: string) {
    setProposalDrafts((current) => ({ ...current, [id]: { ...current[id], note } }));
  }

  function setDraftLine(id: string, index: number, field: "description" | "quantity" | "unitAmountMinor", value: string) {
    setProposalDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        items: current[id].items.map((item, lineIndex) => lineIndex === index
          ? { ...item, [field]: value }
          : item)
      }
    }));
  }

  function addDraftLine(id: string) {
    setProposalDrafts((current) => ({
      ...current,
      [id]: { ...current[id], items: [...current[id].items, { description: "", quantity: "1", unitAmountMinor: "0" }] }
    }));
  }

  function removeDraftLine(id: string, index: number) {
    setProposalDrafts((current) => ({
      ...current,
      [id]: { ...current[id], items: current[id].items.filter((_, lineIndex) => lineIndex !== index) }
    }));
  }

  async function updateStatus(id: string, status: QuoteStatus) {
    setNotice("");
    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        setNotice("The status could not be saved. Refresh and try again.");
        return;
      }
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setNotice("Quotation status updated.");
    } catch {
      setNotice("The status could not be saved. Refresh and try again.");
    }
  }

  async function saveProposal(quote: QuoteRecord) {
    const draft = proposalDrafts[quote.id];
    if (!draft || draft.items.length === 0 || draft.items.some((item) =>
      item.description.trim().length < 2 ||
      !/^\d+$/.test(item.quantity) ||
      !/^\d+$/.test(item.unitAmountMinor)
    )) {
      setNotice("Add at least one valid line with a description, quantity, and non-negative whole amount.");
      return;
    }
    const lineItems = draft.items.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unitAmountMinor: Number(item.unitAmountMinor)
    }));
    const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitAmountMinor, 0);
    if (!Number.isSafeInteger(total)) {
      setNotice("Quotation total is too large.");
      return;
    }
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}/proposal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: draft.currency, note: draft.note, items: lineItems })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Quotation proposal could not be saved.");
        return;
      }
      window.location.reload();
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  async function convertQuote(id: string) {
    try {
      const response = await fetch(`/api/admin/quotes/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const result = await response.json() as { error?: string; orderId?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Quotation could not be converted.");
        return;
      }
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: "converted" } : item));
      setNotice(`Approved quotation converted into an order (${result.orderId}). An invoice was created; services are not activated.`);
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  if (items.length === 0) return <p className="empty-state">No quotation requests yet. New requests will appear here.</p>;

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      <div className="table-scroll">
        <table className="admin-table">
          <thead><tr><th>Request</th><th>Customer</th><th>Submitted</th><th>Quote proposal</th><th>Status & conversion</th></tr></thead>
          <tbody>{items.map((quote) => {
            const draft = proposalDrafts[quote.id];
            const draftTotal = draft.items.reduce((sum, line) =>
              sum + (Number(line.quantity) || 0) * (Number(line.unitAmountMinor) || 0), 0);
            return <tr key={quote.id}>
              <td><strong>{quote.service}</strong><span className="table-detail">{quote.requirements}</span></td>
              <td>{quote.name}<a className="table-detail" href={`mailto:${quote.email}`}>{quote.email}</a>{quote.company && <span className="table-detail">{quote.company}</span>}</td>
              <td>{new Date(quote.created_at).toLocaleDateString()}</td>
              <td>
                <div className="proposal-editor">
                  <select
                    aria-label={`Currency for ${quote.name}'s quotation`}
                    value={draft.currency}
                    onChange={(event) => setDraftCurrency(quote.id, event.target.value === "USD" ? "USD" : "BDT")}
                  ><option value="BDT">BDT</option><option value="USD">USD</option></select>
                  {draft.items.map((line, index) => <div className="proposal-line" key={line.id ?? `new-${index}`}>
                    <input aria-label={`Line ${index + 1} description`} value={line.description} maxLength={200} onChange={(event) => setDraftLine(quote.id, index, "description", event.target.value)} placeholder="Description" />
                    <input aria-label={`Line ${index + 1} quantity`} type="number" min="1" max="1000" step="1" value={line.quantity} onChange={(event) => setDraftLine(quote.id, index, "quantity", event.target.value)} />
                    <input aria-label={`Line ${index + 1} amount in minor units`} type="number" min="0" max="100000000000" step="1" value={line.unitAmountMinor} onChange={(event) => setDraftLine(quote.id, index, "unitAmountMinor", event.target.value)} />
                    {draft.items.length > 1 && <button className="text-button" type="button" onClick={() => removeDraftLine(quote.id, index)}>Remove line</button>}
                  </div>)}
                  <button className="text-button" type="button" onClick={() => addDraftLine(quote.id)}>Add line item</button>
                  <textarea aria-label={`Quotation note for ${quote.name}`} rows={2} maxLength={2000} value={draft.note} onChange={(event) => setDraftNote(quote.id, event.target.value)} placeholder="Scope, exclusions, or response note" />
                  <span className="table-detail">Proposal total: {draft.currency} {draftTotal} minor units</span>
                  {quote.estimate_total_minor !== null && <span className="table-detail">Configured estimate: {quote.currency} {quote.estimate_total_minor} minor units</span>}
                  <button className="small-action" type="button" onClick={() => void saveProposal(quote)}>Save quotation</button>
                </div>
              </td>
              <td>
                <div className="quote-status-actions">
                  <select
                    aria-label={`Status for ${quote.name}'s ${quote.service} request`}
                    value={quote.status}
                    disabled={quote.status === "converted"}
                    onChange={(event) => {
                      const status = quoteStatuses.find((value) => value === event.target.value);
                      if (status && status !== "converted") void updateStatus(quote.id, status);
                    }}
                  >
                    {quote.status === "converted" && <option value="converted" disabled>converted</option>}
                    {quoteStatuses.filter((status) => status !== "converted").map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  {quote.quoted_total_minor !== null && <span className="table-detail">Quoted: {quote.currency} {quote.quoted_total_minor} minor units</span>}
                  {quote.status === "approved" && <button className="small-action" type="button" onClick={() => void convertQuote(quote.id)}>Convert to order</button>}
                </div>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </>
  );
}
