# Operations

## Local operations

- Apply schema changes with `npm run db:migrate`.
- Create the first administrator with `npm run admin:create` from a private interactive terminal. The password is hidden during entry and is never read from an environment variable.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Administrators manage the `/admin` control center, public site content, uploaded images, and SQLite-backed user accounts. Public sign-up remains disabled; account creation and password resets are admin-only.
- Uploaded media is stored under `MEDIA_DIRECTORY` (default `./data/media`). Include that directory in host-level backups and restores; SQLite backups do not contain uploaded media.
- Inspect sales, support, project, content, and finance records in the authorized `/admin` modules.
- Email notifications are queued, not sent, until SMTP is configured. See [Email delivery](./EMAIL_DELIVERY.md).

## SQLite backup

Run `npm run db:backup` on the application host. It uses SQLite's online backup API (so the WAL is included consistently), verifies the snapshot with `PRAGMA integrity_check`, writes a SHA-256 sidecar, and removes only old files matching its own `docknest-<UTC timestamp>.db` backup naming pattern. The default destination is `./backups`; configure `BACKUP_DIR` and `BACKUP_RETENTION_DAYS` as needed.

For Compose, `docker compose exec docknest npm run db:backup` writes into the mounted `./backups` folder. Copy backups off-host and protect them as sensitive customer data. A backup on the same host is not disaster recovery.

## SQLite restore

1. Stop all app processes using the database (`docker compose stop docknest` for Compose).
2. Verify that both the selected `.db` and its `.db.sha256` sidecar are present.
3. Set `RESTORE_FILE` to the verified backup path and run `npm run db:restore`. For Compose, run a one-off container after stopping the service: `docker compose run --rm -e RESTORE_FILE=/app/backups/<backup-file>.db docknest npm run db:restore`.
4. Restore verifies SHA-256 and SQLite integrity before replacing the target. It preserves any existing target as a `.pre-restore-<timestamp>` copy.
5. Start the app, check `/api/health`, sign in, and verify representative customer, order, and ticket records. Record the recovery result and elapsed time.

Never restore while another application process is writing to the database. Test this procedure regularly using a separate disposable database and never overwrite the only known-good backup.

## Known operational gaps

- PostgreSQL, payment reconciliation, renewals, hosting provisioning, and live registrar operations are not implemented.
- No production incident process, monitoring integration, or response-time commitment has been approved.
- Before launch, define on-call ownership, incident communications, access revocation, log retention, restore RPO/RTO, and provider escalation contacts.
