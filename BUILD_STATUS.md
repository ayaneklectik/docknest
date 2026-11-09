# Build Status

**Current phase:** Phase 4 — platform hardening and delivery  
**Overall status:** Active development; substantially expanded, but not a complete or production-ready hosting platform

## Implemented

- Responsive public service pages, contact, quote, hosting configurator, domain requests, support intake, payment instructions, legal information, blog, and knowledge-base routes.
- Admin-managed hosting plans, add-ons, and BDT/USD prices; missing prices remain an explicit manual-quote path.
- Quote configuration and line items; saved proposals, response statuses, and conversion of approved quotes into orders and invoices.
- Orders, cancellation controls, invoice review/voiding, manual payment submission and human verification, partial payments, and balance safeguards.
- Customer lookup and editable customer notes/contact fields.
- Development project creation, status/date updates, and assignment to staff accounts.
- Public support tickets, message threads, internal notes, priority/status/assignment, and queued email notifications.
- Staff roles and permissions enforced on both page and API boundaries; administrator access is separate. Staff account creation is a private CLI operation.
- Audit events for key sales, customer, operations, content, domain, and staff changes; searchable audit view.
- Current lifetime analytics and recorded manually-approved revenue, labeled as unfiltered and not provider-reconciled.
- Article authoring/publishing for blog and knowledge-base pages.
- Registrar adapter interface with a manual-only implementation. No live lookup or purchase is claimed.
- SMTP outbox, explicit dispatch, failure visibility, and retries. Messages stay queued without configuration.
- SQLite migration history through migration `0006`; Docker/Compose packaging files; health endpoint; online SQLite backup and checksum-verified restore scripts.
- Payment approval only changes payment/order/invoice records. There is no provisioning operation.

## Verification completed

- `npm run db:migrate`: passed; workspace migrations are current.
- `npm test`: passed. Integration coverage includes quotation line preservation/conversion, invoice states, rejected/partial payments, overpayment and cancellation safeguards, customer/project/ticket workflows, role checks, article publishing, manual registrar behavior, email queue/retry/configuration behavior, public APIs, and health check.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed using `next build --webpack`.
- Production server smoke: public pages and health endpoint returned 200; unauthenticated admin pages redirected to sign-in; sign-in page returned 200.
- SQLite backup and restore were exercised against a separate disposable database; schema and integrity verification passed. Disposable test data was removed.

## Important outstanding limitations

- **PostgreSQL is not supported.** The app uses synchronous `better-sqlite3` and SQLite-specific SQL. `DATABASE_URL` deliberately fails rather than silently selecting SQLite. A real PostgreSQL adapter requires a persistence and migration refactor.
- Docker CLI was unavailable, so the Docker image and Compose deployment could not be built or smoke-tested.
- SMTP delivery has not been tested against a real provider and no credentials were configured. The outbox/dispatcher is implemented; actual provider operation remains unverified.
- No live registrar, payment gateway, hosting provider, renewal system, or service provisioning exists.
- Backups are manual commands; schedule them and copy them off-host before production. No automated offsite backup service is connected.
- No contractually approved uptime or support SLA was supplied. The `/sla` page explicitly makes no guarantee.
- Production security review, accessibility review, and authenticated end-to-end browser coverage remain outstanding.
- The previous `docknest-platform.zip` predates these changes and will not be overwritten. Final delivery is packaged separately as `docknest-platform-updated.zip`, excluding local databases, secrets, dependency folders, and build caches.

## Production constraints

- Keep SQLite to a single application instance on persistent local storage.
- Do not accept production payments or imply service activation from quote/payment states.
- No external account has been accessed and no deployment has been performed.
- Review legal language, operational ownership, backup recovery objectives, and provider credentials before launch.
