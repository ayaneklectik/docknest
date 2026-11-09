DROP INDEX IF EXISTS email_outbox_status_created;
ALTER TABLE email_outbox RENAME TO email_outbox_previous;

CREATE TABLE email_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  text_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  claimed_at TEXT
);

INSERT INTO email_outbox
  (id, recipient, subject, text_body, status, attempts, last_error, created_at, sent_at)
SELECT id, recipient, subject, text_body, status, attempts, last_error, created_at, sent_at
FROM email_outbox_previous;

DROP TABLE email_outbox_previous;
CREATE INDEX email_outbox_status_created ON email_outbox(status, created_at);
