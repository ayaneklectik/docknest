import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";
import { rdapRegistrarAdapter } from "@backend/registrar";

export type DomainRequestStatus =
  | "manual_check_required"
  | "available"
  | "unavailable"
  | "registered"
  | "rejected";

export type DomainRequestRecord = {
  id: string;
  domain_name: string;
  status: DomainRequestStatus;
  registrar_reference: string | null;
  created_at: string;
  updated_at: string;
};

function assertReady() {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }
}

export async function createDomainRequest(input: {
  domain: string;
  name: string;
  email: string;
  phone: string;
}): Promise<{ id: string; status: DomainRequestStatus; message: string }> {
  assertReady();
  const result = await rdapRegistrarAdapter.checkAvailability(input.domain);
  const id = randomUUID();
  const email = input.email.trim().toLowerCase();
  const save = db.transaction(() => {
    let customer = db.prepare("SELECT id FROM customers WHERE email = ?").get(email) as { id: string } | undefined;
    if (!customer) {
      customer = { id: randomUUID() };
      db.prepare("INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)")
        .run(customer.id, input.name, email, input.phone);
    } else {
      db.prepare(
        "UPDATE customers SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(input.name, input.phone, customer.id);
    }
    db.prepare(
      `INSERT INTO domain_requests (id, customer_id, domain_name, status, registrar_reference)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, customer.id, input.domain, result.status, result.reference);
  });
  save();
  return { id, status: result.status, message: result.message };
}

export function listDomainRequests(): DomainRequestRecord[] {
  assertReady();
  return db.prepare(
    `SELECT id, domain_name, status, registrar_reference, created_at, updated_at
     FROM domain_requests ORDER BY created_at DESC LIMIT 300`
  ).all() as DomainRequestRecord[];
}

export function updateDomainRequest(
  id: string,
  status: DomainRequestStatus,
  reference: string | null,
  actorId: string
): boolean {
  assertReady();
  const update = db.transaction(() => {
    const changed = db.prepare(
      `UPDATE domain_requests SET status = ?, registrar_reference = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'registered'`
    ).run(status, reference, id);
    if (changed.changes === 1) {
      db.prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
         VALUES (?, ?, 'domain_request.updated', 'domain_request', ?, ?)`
      ).run(randomUUID(), actorId, id, JSON.stringify({ status, reference }));
    }
    return changed.changes === 1;
  });
  return update();
}
