import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";
import { enqueueEmail } from "@backend/email";
import type { ProjectStatus, ProjectRecord, TicketPriority, TicketRecord, TicketStatus } from "@/lib/operations-types";

export { projectStatuses, ticketPriorities, ticketStatuses } from "@/lib/operations-types";
export type { ProjectRecord, ProjectStatus, TicketPriority, TicketRecord, TicketStatus } from "@/lib/operations-types";

function assertReady() {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }
}

function assertAssignableStaff(userId: string | null) {
  if (!userId) return;
  const user = db.prepare(
    `SELECT 1 FROM user u WHERE u.id = ? AND (
       u.role = 'admin' OR EXISTS (
         SELECT 1 FROM staff_assignments a WHERE a.user_id = u.id
       )
     )`
  ).get(userId);
  if (!user) throw new Error("Choose an administrator or a staff account with an assigned role.");
}

export function listProjects(): ProjectRecord[] {
  assertReady();
  return db.prepare(
    `SELECT p.id, p.customer_id, c.name AS customer_name, c.email AS customer_email,
            p.title, p.description, p.status, p.due_at, p.assigned_to,
            u.name AS assignee_name, p.created_at, p.updated_at
     FROM development_projects p
     JOIN customers c ON c.id = p.customer_id
     LEFT JOIN user u ON u.id = p.assigned_to
     ORDER BY p.updated_at DESC LIMIT 300`
  ).all() as ProjectRecord[];
}

export function createProject(input: {
  customerId: string;
  title: string;
  description: string;
  dueAt: string | null;
}, actorId: string): string {
  assertReady();
  const id = randomUUID();
  const created = db.transaction(() => {
    const customer = db.prepare("SELECT id FROM customers WHERE id = ?").get(input.customerId);
    if (!customer) throw new Error("Choose an existing customer.");
    db.prepare(
      `INSERT INTO development_projects (id, customer_id, title, description, due_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.customerId, input.title, input.description, input.dueAt);
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'project.created', 'project', ?, '{}')`
    ).run(randomUUID(), actorId, id);
    return id;
  });
  return created();
}

export function updateProject(
  id: string,
  input: { status: ProjectStatus; dueAt: string | null; assignedTo: string | null },
  actorId: string
): boolean {
  assertReady();
  assertAssignableStaff(input.assignedTo);
  const updated = db.prepare(
    `UPDATE development_projects
     SET status = ?, due_at = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(input.status, input.dueAt, input.assignedTo, id);
  if (updated.changes === 1) {
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'project.updated', 'project', ?, ?)`
    ).run(randomUUID(), actorId, id, JSON.stringify(input));
  }
  return updated.changes === 1;
}

export function listSupportTickets(): TicketRecord[] {
  assertReady();
  return db.prepare(
    `SELECT t.id, t.ticket_number, t.customer_id, t.name, t.email, t.subject,
            t.status, t.priority, t.assigned_to, t.created_at, t.updated_at,
            (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id) AS message_count,
            (SELECT m.body FROM support_messages m WHERE m.ticket_id = t.id AND m.internal = 0
             ORDER BY m.created_at DESC LIMIT 1) AS last_message
     FROM support_tickets t
     ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
              CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
              t.updated_at DESC LIMIT 300`
  ).all() as TicketRecord[];
}

export function createSupportTicket(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
}): { id: string; ticketNumber: string } {
  assertReady();
  const id = randomUUID();
  const email = input.email.toLowerCase();
  const create = db.transaction(() => {
    let customer = db.prepare("SELECT id FROM customers WHERE email = ?").get(email) as { id: string } | undefined;
    if (!customer) {
      customer = { id: randomUUID() };
      db.prepare("INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)")
        .run(customer.id, input.name, email, input.phone);
    } else {
      db.prepare(
        "UPDATE customers SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(input.phone, customer.id);
    }
    const ticketNumber = `DN-SUP-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO support_tickets (id, ticket_number, customer_id, name, email, subject)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, ticketNumber, customer.id, input.name, email, input.subject);
    db.prepare(
      `INSERT INTO support_messages (id, ticket_id, author_name, body)
       VALUES (?, ?, ?, ?)`
    ).run(randomUUID(), id, input.name, input.body);
    enqueueEmail(
      email,
      `Docknest support request ${ticketNumber} received`,
      `Hello ${input.name},\n\nWe recorded your support request: ${input.subject}\n\nReference: ${ticketNumber}\n\nThis message confirms receipt only; it is not a response-time commitment. Please do not reply with passwords, payment credentials, or API keys.`
    );
    return { id, ticketNumber };
  });
  return create();
}

export function listSupportMessages(ticketId: string) {
  assertReady();
  return db.prepare(
    `SELECT id, ticket_id, author_user_id, author_name, body, internal, created_at
     FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC LIMIT 500`
  ).all(ticketId) as Array<{
    id: string; ticket_id: string; author_user_id: string | null;
    author_name: string; body: string; internal: 0 | 1; created_at: string;
  }>;
}

export function updateTicket(
  id: string,
  input: { status: TicketStatus; priority: TicketPriority; assignedTo: string | null },
  actorId: string
): boolean {
  assertReady();
  assertAssignableStaff(input.assignedTo);
  const updated = db.prepare(
    `UPDATE support_tickets
     SET status = ?, priority = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(input.status, input.priority, input.assignedTo, id);
  if (updated.changes === 1) {
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'ticket.updated', 'ticket', ?, ?)`
    ).run(randomUUID(), actorId, id, JSON.stringify(input));
  }
  return updated.changes === 1;
}

export function addTicketMessage(
  id: string,
  input: { authorId: string; authorName: string; body: string; internal: boolean }
): boolean {
  assertReady();
  const add = db.transaction(() => {
    const ticket = db.prepare(
      "SELECT id, ticket_number, name, email FROM support_tickets WHERE id = ?"
    ).get(id) as { id: string; ticket_number: string; name: string; email: string } | undefined;
    if (!ticket) return false;
    db.prepare(
      `INSERT INTO support_messages (id, ticket_id, author_user_id, author_name, body, internal)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(randomUUID(), id, input.authorId, input.authorName, input.body, input.internal ? 1 : 0);
    db.prepare("UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'ticket.message_added', 'ticket', ?, ?)`
    ).run(randomUUID(), input.authorId, id, JSON.stringify({ internal: input.internal }));
    if (!input.internal) {
      enqueueEmail(
        ticket.email,
        `Docknest support updated ${ticket.ticket_number}`,
        `Hello ${ticket.name},\n\nOur team added a reply to your support request ${ticket.ticket_number}:\n\n${input.body}\n\nDo not reply with passwords, payment credentials, or API keys.`
      );
    }
    return true;
  });
  return add();
}
