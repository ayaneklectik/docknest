"use client";

import { useState } from "react";
import type { DomainRequestRecord, DomainRequestStatus } from "@backend/domains";

const domainStatuses: DomainRequestStatus[] = ["manual_check_required", "available", "unavailable", "registered", "rejected"];

export function AdminDomains({ requests: initialRequests }: { requests: DomainRequestRecord[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [notice, setNotice] = useState("");

  async function update(item: DomainRequestRecord, status: DomainRequestStatus, reference: string) {
    try {
      const response = await fetch(`/api/admin/domains/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reference: reference || null })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Domain request could not be updated.");
        return;
      }
      setRequests((current) => current.map((request) => request.id === item.id ? {
        ...request, status, registrar_reference: reference || null
      } : request));
      setNotice("Manual domain-check result saved.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return <>
    <p className="form-message" aria-live="polite" role="status">{notice}</p>
    {requests.length === 0 ? <p className="empty-state">No domain requests have been submitted.</p> : <div className="table-scroll"><table className="admin-table">
      <thead><tr><th>Requested domain</th><th>Received</th><th>Manual status</th><th>Reference / note</th><th>Save</th></tr></thead>
      <tbody>{requests.map((item) => <DomainRequestRow key={item.id} item={item} onSave={update} />)}</tbody>
    </table></div>}
    <p className="pricing-note">No live registrar connection is configured. “Available” or “Registered” must only be selected after an authorized person verifies it externally.</p>
  </>;
}

function DomainRequestRow({ item, onSave }: {
  item: DomainRequestRecord;
  onSave: (item: DomainRequestRecord, status: DomainRequestStatus, reference: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [reference, setReference] = useState(item.registrar_reference ?? "");
  return <tr>
    <td><strong>{item.domain_name}</strong></td>
    <td>{new Date(item.created_at).toLocaleDateString()}</td>
    <td><select value={status} onChange={(event) => {
      const selected = domainStatuses.find((value) => value === event.target.value);
      if (selected) setStatus(selected);
    }}>{domainStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></td>
    <td><input className="domain-reference-input" value={reference} maxLength={240} onChange={(event) => setReference(event.target.value)} aria-label={`Manual note for ${item.domain_name}`} /></td>
    <td><button className="small-action" type="button" onClick={() => void onSave(item, status, reference)}>Save</button></td>
  </tr>;
}
