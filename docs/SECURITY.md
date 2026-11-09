# Security

## Implemented controls

- Better Auth manages password authentication and server-side sessions.
- Email/password sign-up is disabled in the web application. The first administrator is created from a private interactive terminal; its password is not read from environment variables and is stored only as a Better Auth hash.
- Administrator pages and protected API routes check the authenticated user's `admin` role on the server. Admin account-management operations validate user IDs and roles, revoke sessions when passwords or roles change, and prevent deleting the active or last administrator.
- User records live in Better Auth's SQLite `user`, `account`, and `session` tables. User-supplied values in application SQL use bound parameters; the only dynamic SQL identifiers are selected from fixed internal allow-lists. Search input is escaped and bound, not inserted into SQL.
- Quote input is validated with Zod, HTML is rendered through React escaping, and request size/rate limits are applied.
- The rate limiter stores a SHA-256 digest of the client address and deletes old windows. It relies on deployment proxy headers being configured correctly.
- Production startup requires `BETTER_AUTH_SECRET` with at least 32 characters. Security headers disable framing and set content-type/referrer protections.
- No payment provider or service provisioning is connected; payment status cannot activate a service in this build.

## Outstanding before production

The application has not had an independent security review. Add robust proxy/IP trust configuration, stronger monitoring and alerting, dependency update procedures, backup-access controls, and security tests. Review CSP and deployment headers, privacy/retention policies, account recovery, email verification, and operator access controls. Do not treat this MVP as production-hardened.
