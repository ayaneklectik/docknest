import { db, isBusinessDatabaseReady } from "@backend/db";

export type AuditRecord = {
  id: string;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details_json: string;
  created_at: string;
};

export function listAuditLogs(search = ""): AuditRecord[] {
  if (!isBusinessDatabaseReady()) throw new Error("Run npm run db:migrate before viewing audit logs.");
  const term = `%${search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  return db.prepare(
    `SELECT a.id, u.name AS actor_name, u.email AS actor_email,
            a.action, a.entity_type, a.entity_id, a.details_json, a.created_at
     FROM audit_logs a LEFT JOIN user u ON u.id = a.actor_user_id
     WHERE a.action LIKE @term ESCAPE '\\'
        OR a.entity_type LIKE @term ESCAPE '\\'
        OR a.entity_id LIKE @term ESCAPE '\\'
        OR COALESCE(u.email, '') LIKE @term ESCAPE '\\'
     ORDER BY a.created_at DESC LIMIT 500`
  ).all({ term }) as AuditRecord[];
}
