# Architecture

## Current direction

Docknest is a TypeScript Next.js App Router application. Public pages use server rendering; interactive controls are isolated into client components. Route handlers validate external input before writing to SQLite through prepared statements.

The repository separates `frontend/` (Next.js pages, UI, and route-handler entrypoints), `backend/` (server-side business logic and operational scripts), and `database/` (numbered SQL migrations). Route handlers remain part of the Next.js app because Next.js owns the HTTP entrypoints; they call the reusable server-side logic in `backend/`.

Better Auth is selected for authentication rather than custom password/session handling. It will share the local SQLite file with business data. Business entities use normalized tables and additive, numbered SQL migrations. This keeps local setup simple and avoids a paid database dependency.

## Deployment shape

The application currently targets a single Node.js process on a VPS or in Docker with a persistent data volume. Set secrets only in the environment. The SQLite database must reside on persistent local storage and be backed up consistently. PostgreSQL is not currently supported: synchronous `better-sqlite3` calls and SQLite-specific SQL are used throughout the service layer. `DATABASE_URL` fails explicitly. Do not scale multiple app instances until a real PostgreSQL persistence refactor and concurrency testing are complete.

## Boundaries

- Public catalog and sales-request UI
- Validated server routes and service logic
- Relational SQLite persistence
- Authentication and server-side authorization
- Manual-only registrar adapter boundary; no external provider is contacted
- SMTP-backed outbox, which only sends when explicitly configured and dispatched
- Future payment and infrastructure provider adapters

External adapters remain unavailable until they have been implemented, configured, and tested against official provider documentation. Payment review and service activation must remain separate operations.

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth installation](https://www.better-auth.com/docs/installation)
