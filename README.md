# Docknest

Docknest is an early-stage hosting and digital services platform. This repository contains an incomplete MVP foundation, not a production-ready hosting, billing, or provisioning system.

## Project layout

- `frontend/` contains the Next.js App Router application, UI components, and static assets. Its API route handlers are Next.js backend entrypoints.
- `backend/` contains server-side business logic, operational scripts, and backend tests.
- `database/` contains the numbered SQLite schema migrations. The runtime SQLite file and uploaded media remain under `data/` by default.

## Git branches

`main` is the integration branch. The `frontend`, `backend`, and `database` branches are focused development branches; each intentionally keeps the complete monorepo so the app remains buildable and testable. Work stays organized in the matching folders and is merged back into `main`.

## Requirements

- Node.js 20.9 or newer
- npm

## Local setup

1. Copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` to a random value of at least 32 characters.
2. Install dependencies with `npm install`.
3. Initialize the local SQLite database and authentication schema with `npm run db:migrate`.
4. Create the first administrator with `npm run admin:create` from a private interactive terminal. The command prompts for the email and reads the password without echoing it; credentials are not supplied through environment variables. The bootstrap command refuses to create a second administrator.
5. Start the development server with `npm run dev`.
6. Open <http://localhost:3000>.

Hosting prices are configured by administrators; incomplete configurations remain manual quotations. Payment references require manual review and never provision a service. Domain availability is not queried; no registrar integration is configured. Email notifications remain queued until SMTP is configured and dispatched.

The public website is edited by the administrator from `/admin/site`: each editor section identifies its public location and links to a preview. Manage products and prices at `/admin/products`; product categories place offerings on the Hosting (`/hosting`), Development & Maintenance (`/services`), or Domains (`/domains`) page, as well as in the homepage service cards. Manage articles at `/admin/content`; published blog posts appear at `/blog` and may appear in the homepage journal, while knowledge-base guides appear at `/knowledge-base`. Admins can manage customer and administrator accounts from `/admin/users`; public sign-up remains disabled. Account records use the SQLite authentication tables, and passwords are stored as hashes. Uploaded images are stored locally under `./data/media` by default; preserve that folder alongside database backups. To send queued notifications, configure SMTP using [the email delivery guide](./docs/EMAIL_DELIVERY.md), then run `npm run email:dispatch`. For Docker, backup, restore, and deployment instructions, see [Deployment](./docs/DEPLOYMENT.md) and [Operations](./docs/OPERATIONS.md).

## Status

See [BUILD_STATUS.md](./BUILD_STATUS.md) for what is implemented and what remains. Do not use this MVP to accept or provision paid services until the outstanding authentication, operations, payment, and deployment work is completed and reviewed.

## Documentation

Start with [the architecture](./docs/ARCHITECTURE.md), then see the [local setup](./docs/LOCAL_SETUP.md), [API specification](./docs/API_SPECIFICATION.md), [security notes](./docs/SECURITY.md), and [deployment checklist](./docs/DEPLOYMENT.md). All documents distinguish implemented functionality from planned work.
