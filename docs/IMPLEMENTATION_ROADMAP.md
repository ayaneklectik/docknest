# Implementation Roadmap

Checkboxes represent implemented and tested behavior, not schema-only placeholders or unverified external integrations.

## Phase 1 — Existing foundation

- [x] Responsive public-site foundation and core service/contact/domain/quote routes.
- [x] Better Auth administrator sign-in, SQLite migration runner, and quote intake.
- [x] Initial build, lint, type-check, and database tests.

## Phase 2 — Catalog and sales workflows

- [x] Hosting products/add-ons and BDT/USD price administration.
- [x] Hosting configurator with configured estimates and manual-quote fallback.
- [x] Quote line-item editing, proposal/status management, and approved-quote conversion.
- [x] Orders, customer-submitted payment references, manual review, invoices, and balance safeguards.
- [x] Customer lookup and editable customer details.
- [x] Focused tests and production build after these changes.

## Phase 3 — Operations and integrations

- [x] Development project creation, workflow status, dates, and staff assignment.
- [x] Public support intake, threaded replies/internal notes, assignment, priority, and status.
- [x] Staff roles/permissions with server-side page and API checks; private staff-account creation.
- [x] Audit log and searchable reporting view.
- [x] Blog and knowledge-base authoring and published pages.
- [x] Registrar adapter boundary and truthful manual-only behavior.
- [x] SMTP-backed outbox, explicit dispatch, and retry/failure visibility. Real-provider delivery is not verified.
- [x] Basic lifetime sales and operations metrics; advanced/date-filtered reporting remains future work.

## Phase 4 — Platform and operations (in progress)

- [x] Public legal/policy routes including an explicit no-SLA statement; contractual terms still require business/legal review.
- [x] Dockerfile, Compose configuration, health endpoint, deployment guidance.
- [ ] Build and test the Docker image/Compose stack when Docker is available.
- [ ] PostgreSQL persistence and migrations. Current code remains SQLite-specific and rejects `DATABASE_URL`.
- [x] SQLite online backup, checksum verification, restore procedure, and isolated recovery test.
- [ ] Schedule offsite backups and perform production recovery drills.

## Phase 5 — Production readiness

- [ ] Configure and verify real SMTP delivery in a user-owned environment.
- [ ] Complete production security and accessibility reviews.
- [ ] Add authenticated browser end-to-end tests across staff roles.
- [ ] Define operational ownership, monitoring, legal terms, provider integrations, and provisioning controls.

## Phase 6 — Delivery

- [x] Run test suite, type-check, lint, production build, and unauthenticated route smoke checks.
- [x] Create and verify a refreshed archive under a new filename; preserve the earlier ZIP.
- [x] Record final artifact name and verification in `BUILD_STATUS.md`.

## Explicit non-goals until implemented

No live domain availability or registration, payment gateway, infrastructure-provider API, automated service provisioning, or production deployment is represented by this application.
