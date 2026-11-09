# Docknest Platform Blueprint

## Product

Docknest is a Bangladesh- and international-market hosting and digital-solutions business for individuals, small businesses, startups, freelancers, agencies, and established companies. The platform should support both self-service purchase journeys and consultation-led sales. It must not advertise WordPress development or imply integrations are live when they are not.

## Initial architecture decision

- **Web application:** Next.js App Router and TypeScript, for a single deployable web application with server-rendered public content and route handlers.
- **Database:** SQLite on a local disk for the low-cost, single-instance MVP. The relational schema is versioned as SQL migrations. Move to PostgreSQL before multi-instance operation.
- **Authentication:** Better Auth, avoiding bespoke password/session cryptography.
- **Validation:** Zod at request boundaries.
- **Deployment:** Node.js on a VPS or Docker; no GitHub account or external deployment service is required.
- **Integrations:** Adapter boundaries and configuration only until official API documentation, credentials, and operational requirements are confirmed.

## Trade-offs and costs

All selected runtime packages are open source and do not require a paid license. A VPS, domain, email delivery, registrar, payment gateway, and any cPanel license may incur third-party costs. SQLite reduces initial operational overhead but is not the final choice for horizontal scaling or high concurrent writes. Next.js has more runtime moving parts than a static site, in exchange for server-side workflows and a cohesive application.

## Safety and product rules

- Hosting pricing remains unset until an administrator configures real prices.
- A submitted payment must never activate or provision a service automatically.
- Domain status is unknown unless a real registrar integration returns a result.
- Development-service content excludes WordPress development.
- Do not connect external accounts or deploy without explicit authorization.

## First-release scope

The first development increment establishes the application, brand direction, public catalogue, request capture, database migrations, and operator documentation. Admin workflows, complete authorization, payments, provider integrations, legal review, production hardening, and remaining business modules are tracked as incomplete in `BUILD_STATUS.md` and `docs/IMPLEMENTATION_ROADMAP.md`.
