# Testing

## Commands

- `npm test` — verifies quotation validation, SQLite persistence, search, and status updates against a temporary database.
- `npm run lint` — ESLint checks.
- `npm run typecheck` — TypeScript checks.
- `npm run build` — optimized Next.js production build.
- `npm run db:migrate` — applies business and Better Auth schema.

## Current coverage

The automated test suite currently contains a database-level quotation workflow test. First-admin bootstrap and migration behavior were also smoke-tested locally using a temporary database. The production dependency audit reported zero vulnerabilities at the time of this development pass; a full dependency audit reported moderate findings in development dependencies.

End-to-end browser, cross-browser, accessibility, payment, registrar, authorization matrix, backup/restore, and production database tests remain outstanding.
