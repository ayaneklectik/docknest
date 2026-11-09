"use client";

import { useState } from "react";

type EmailRecord = {
  id: string;
  recipient: string;
  subject: string;
  status: "queued" | "sending" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export function AdminEmail({ messages: initialMessages, smtpConfigured }: {
  messages: EmailRecord[];
  smtpConfigured: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [notice, setNotice] = useState("");

  async function dispatch() {
    setNotice("");
    try {
      const response = await fetch("/api/admin/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const result = await response.json() as { error?: string; sent?: number; failed?: number; queued?: number };
      if (!response.ok) {
        setNotice(result.error ?? "Email dispatch failed.");
        return;
      }
      setNotice(`Dispatch attempted: ${result.sent ?? 0} sent, ${result.failed ?? 0} failed, ${result.queued ?? 0} still queued.`);
      window.location.reload();
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  async function retry(id: string) {
    try {
      const response = await fetch(`/api/admin/email/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Email could not be requeued.");
        return;
      }
      setMessages((current) => current.map((item) => item.id === id ? { ...item, status: "queued", last_error: null } : item));
      setNotice("Failed email queued for another attempt.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return <>
    <div className="email-config-state"><span className={`status-pill status-${smtpConfigured ? "approved" : "pending_review"}`}>{smtpConfigured ? "SMTP configured" : "SMTP not configured"}</span><p>{smtpConfigured ? "A manual dispatch sends at most one queued message per request. A single worker process is recommended." : "Messages remain queued. Set SMTP_HOST, SMTP_PORT, SMTP_FROM and optional matching SMTP_USER / SMTP_PASSWORD before dispatch."}</p><button className="small-action" onClick={() => void dispatch()} type="button" disabled={!smtpConfigured}>Send next queued message</button><span className="table-detail">See docs/EMAIL_DELIVERY.md for email setup and operations.</span></div>
    <p className="form-message" aria-live="polite" role="status">{notice}</p>
    {messages.length === 0 ? <p className="empty-state">No email notifications have been queued.</p> : <div className="table-scroll"><table className="admin-table">
      <thead><tr><th>Queued</th><th>Recipient / subject</th><th>Status</th><th>Attempts / error</th><th>Actions</th></tr></thead>
      <tbody>{messages.map((message) => <tr key={message.id}>
        <td>{new Date(message.created_at).toLocaleString()}</td>
        <td><strong>{message.recipient}</strong><span className="table-detail">{message.subject}</span></td>
        <td><span className={`status-pill status-${message.status}`}>{message.status}</span>{message.sent_at && <span className="table-detail">Sent {new Date(message.sent_at).toLocaleString()}</span>}</td>
        <td>{message.attempts}{message.last_error && <span className="table-detail email-error">{message.last_error}</span>}</td>
        <td>{message.status === "failed" && <button className="small-action" type="button" onClick={() => void retry(message.id)}>Requeue</button>}</td>
      </tr>)}</tbody>
    </table></div>}
  </>;
}
