# Deployment

## Current status

The application has a verified Next.js production build, a Dockerfile, and a single-instance Docker Compose configuration. No live deployment or Docker image build was performed in this workspace. Docker was unavailable during validation. No reverse proxy, domain, or SSL setup is supplied.

## Before a production launch

1. Use a supported Node.js LTS release (Node 22 is used in the Docker image) and run `npm ci`.
2. Provide `BETTER_AUTH_SECRET` (at least 32 high-entropy characters), `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, and a persistent `DATABASE_PATH`.
3. Run `npm run db:migrate`.
4. Run `npm run admin:create` from a private interactive terminal and enter the administrator credentials at the prompts. The password prompt does not echo input and credentials must not be passed as environment variables.
5. Run `npm run build`, then `npm run start` behind a correctly configured HTTPS reverse proxy.
6. Configure a trusted proxy so forwarded client-IP headers cannot be spoofed. Restrict database file permissions and test restore procedures.

## Docker Compose

1. Copy `.env.example` to `.env`; set a unique `BETTER_AUTH_SECRET` (at least 32 characters) and the canonical HTTPS URLs.
2. Create the host `backups/` directory with write access for the container's unprivileged `node` user.
3. Build and start the single instance with `docker compose up --build -d`.
4. Create the first administrator from a private terminal inside the container with `docker compose exec docknest npm run admin:create`; enter the credentials at the prompts. Do not pass bootstrap credentials as environment variables.
5. Check readiness at `/api/health` and container status with `docker compose ps`.

The container applies numbered schema migrations on startup. It persists SQLite in the `docknest-data` volume and mounts `./backups` separately. Keep this to one app instance; SQLite on a shared filesystem is not a horizontal-scaling strategy. SMTP is optional and is not configured by default. See [Operations](./OPERATIONS.md) for verified backup and restore commands.

## Database support boundary

This release is SQLite-only. Setting `DATABASE_URL` intentionally fails at startup rather than silently falling back to SQLite. PostgreSQL support requires a planned asynchronous persistence-layer and migration refactor; it is not implemented or implied by this Docker setup.

The current app is not ready for production transactions or service provisioning. Provider operations, PostgreSQL, legal review, production monitoring, security review, and recovery drills remain launch blockers.
