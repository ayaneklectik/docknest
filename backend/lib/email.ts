import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import { db, isBusinessDatabaseReady } from "@backend/db";

type EmailRow = {
  id: string;
  recipient: string;
  subject: string;
  text_body: string;
};

function assertReady() {
  if (!isBusinessDatabaseReady()) throw new Error("Run npm run db:migrate before using the email outbox.");
}

function smtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const from = process.env.SMTP_FROM?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (Boolean(user) !== Boolean(pass)) return null;
  return { host, port, from, user, pass };
}

export function isSmtpConfigured(): boolean {
  return smtpConfiguration() !== null;
}

export function enqueueEmail(recipient: string, subject: string, textBody: string): string {
  assertReady();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO email_outbox (id, recipient, subject, text_body)
     VALUES (?, ?, ?, ?)`
  ).run(id, recipient, subject, textBody);
  return id;
}

export function listEmailOutbox() {
  assertReady();
  return db.prepare(
    `SELECT id, recipient, subject, status, attempts, last_error, created_at, sent_at
     FROM email_outbox ORDER BY created_at DESC LIMIT 300`
  ).all() as Array<{
    id: string; recipient: string; subject: string;
    status: "queued" | "sending" | "sent" | "failed";
    attempts: number; last_error: string | null; created_at: string; sent_at: string | null;
  }>;
}

export function retryEmail(id: string): boolean {
  assertReady();
  return db.prepare(
    `UPDATE email_outbox SET status = 'queued', last_error = NULL, claimed_at = NULL
     WHERE id = ? AND status = 'failed'`
  ).run(id).changes === 1;
}

export async function dispatchQueuedEmails(limit = 10) {
  assertReady();
  const config = smtpConfiguration();
  if (!config) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_FROM, and matching SMTP credentials before dispatch.");
  }
  const batchSize = Math.max(1, Math.min(50, Math.trunc(limit)));
  db.prepare(
    `UPDATE email_outbox SET status = 'queued', claimed_at = NULL
     WHERE status = 'sending' AND claimed_at < datetime('now', '-10 minutes')`
  ).run();

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  });
  const rows = db.prepare(
    `SELECT id, recipient, subject, text_body FROM email_outbox
     WHERE status = 'queued' ORDER BY created_at ASC LIMIT ?`
  ).all(batchSize) as EmailRow[];
  let sent = 0;
  let failed = 0;

  try {
    for (const row of rows) {
      const claim = db.prepare(
        `UPDATE email_outbox SET status = 'sending', attempts = attempts + 1,
         claimed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'queued'`
      ).run(row.id);
      if (claim.changes !== 1) continue;

      try {
        await transport.sendMail({
          from: config.from,
          to: row.recipient,
          subject: row.subject,
          text: row.text_body
        });
        db.prepare(
          `UPDATE email_outbox SET status = 'sent', sent_at = CURRENT_TIMESTAMP,
           claimed_at = NULL, last_error = NULL WHERE id = ? AND status = 'sending'`
        ).run(row.id);
        sent += 1;
      } catch (error) {
        const detail = error instanceof Error ? error.message.slice(0, 1000) : "Unknown SMTP delivery error.";
        db.prepare(
          `UPDATE email_outbox SET status = 'failed', claimed_at = NULL, last_error = ?
           WHERE id = ? AND status = 'sending'`
        ).run(detail, row.id);
        failed += 1;
      }
    }
  } finally {
    transport.close();
  }

  const queued = (db.prepare("SELECT COUNT(*) AS count FROM email_outbox WHERE status IN ('queued', 'sending')").get() as { count: number }).count;
  return { attempted: sent + failed, sent, failed, queued };
}
