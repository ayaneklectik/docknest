"use client";

import { FormEvent, useState } from "react";
import { ticketPriorities, ticketStatuses, type TicketRecord } from "@/lib/operations-types";
import type { StaffUser } from "@/lib/staff-types";

type TicketMessage = {
  id: string;
  author_name: string;
  body: string;
  internal: 0 | 1;
  created_at: string;
};

export function AdminTickets({ tickets: initialTickets, staff }: { tickets: TicketRecord[]; staff: StaffUser[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [notice, setNotice] = useState("");

  async function openThread(id: string) {
    setSelectedId(id);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/tickets/${id}/messages`);
      const result = await response.json() as { error?: string; messages?: TicketMessage[] };
      if (!response.ok) {
        setNotice(result.error ?? "Ticket messages could not be loaded.");
        return;
      }
      setMessages(result.messages ?? []);
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  async function saveTriage(event: FormEvent<HTMLFormElement>, ticket: TicketRecord) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.get("status"),
          priority: form.get("priority"),
          assignedTo: form.get("assignedTo") || null
        })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Ticket could not be updated.");
        return;
      }
      setTickets((current) => current.map((item) => item.id === ticket.id ? {
        ...item,
        status: String(form.get("status")) as TicketRecord["status"],
        priority: String(form.get("priority")) as TicketRecord["priority"],
        assigned_to: String(form.get("assignedTo") || "") || null
      } : item));
      setNotice("Ticket triage saved.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch(`/api/admin/tickets/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: form.get("body"), internal: form.get("internal") === "on" })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Message could not be added.");
        return;
      }
      formElement.reset();
      await openThread(selectedId);
      setNotice("Message added to the ticket.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      {tickets.length === 0 ? <p className="empty-state">No support tickets have been submitted.</p> : (
        <div className="ticket-list">{tickets.map((ticket) => (
          <article className="ticket-card" key={ticket.id}>
            <div className="project-card-heading"><div><span className="section-kicker">{ticket.ticket_number} · {ticket.name} · {ticket.email}</span><h3>{ticket.subject}</h3></div><span className={`status-pill status-${ticket.priority}`}>{ticket.priority}</span></div>
            <p>{ticket.last_message}</p>
            <form className="ticket-triage" onSubmit={(event) => void saveTriage(event, ticket)}>
              <label>Status<select name="status" defaultValue={ticket.status}>{ticketStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
              <label>Priority<select name="priority" defaultValue={ticket.priority}>{ticketPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
              <label>Assignee<select name="assignedTo" defaultValue={ticket.assigned_to ?? ""}><option value="">Unassigned</option>{staff.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
              <button className="small-action" type="submit">Save triage</button>
              <button className="small-action" type="button" onClick={() => void openThread(ticket.id)}>{selectedId === ticket.id ? "Refresh thread" : `Thread (${ticket.message_count})`}</button>
            </form>
            {selectedId === ticket.id && <section className="ticket-thread" aria-label={`Messages for ${ticket.ticket_number}`}>
              {messages.map((message) => <article className={message.internal ? "ticket-message ticket-message-internal" : "ticket-message"} key={message.id}>
                <div><strong>{message.author_name}</strong>{message.internal === 1 && <span>Internal note</span>}<time>{new Date(message.created_at).toLocaleString()}</time></div>
                <p>{message.body}</p>
              </article>)}
              <form className="ticket-reply" onSubmit={reply}>
                <label>Reply or internal note<textarea name="body" minLength={1} maxLength={5000} rows={3} required /></label>
                <label className="internal-toggle"><input name="internal" type="checkbox" /> Internal only — do not send to the customer</label>
                <button className="small-action" type="submit">Add message</button>
              </form>
            </section>}
            <span className="table-detail">Updated {new Date(ticket.updated_at).toLocaleString()}</span>
          </article>
        ))}</div>
      )}
    </>
  );
}
