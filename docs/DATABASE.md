# Database

## Current database

The MVP uses one SQLite file selected by `DATABASE_PATH` (default: `./data/docknest.db`). `better-sqlite3` is configured with foreign keys, a busy timeout, and WAL mode. Keep the file on persistent local storage; do not put it on a network filesystem.

Business schema changes are additive, numbered SQL files in `database/migrations/`. `npm run db:migrate` applies unapplied business migrations and then runs Better Auth's schema migration API. Product starting prices are optional display-only BDT/USD amounts; configured billing prices remain the source for quote calculations. Quotation requests are stored in `quote_requests`; short-lived rate-limit counters are stored in `rate_limit_hits`.

## Data integrity

Quotation IDs are UUIDs. Status values are constrained in SQLite and validated in TypeScript before updates. User credentials and sessions are managed by Better Auth; passwords are not stored in the business tables.

## Scaling

SQLite is an intentional single-instance MVP choice. Before multi-instance deployment or materially higher write concurrency, migrate to PostgreSQL and update persistence, migration, backup, and deployment procedures. No PostgreSQL migration has been implemented.
