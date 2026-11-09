# Backup and Recovery

## Current state

The application stores business data and Better Auth records in a local SQLite database. Automated backups, retention, encryption-at-rest, and restore drills are not implemented.

## Manual baseline

Stop application writes before copying the SQLite database, or use SQLite's online backup facilities to produce a consistent snapshot while the app is running. Preserve file permissions and keep backups outside the web root on a separate protected storage location. Do not place backups in the project archive or public assets.

## Recovery

Restore the database to the configured `DATABASE_PATH`, verify ownership and permissions, run `npm run db:migrate`, start the application, and validate admin sign-in and quotation records. Test this procedure in a non-production environment before launch. Define retention, encryption, off-site copies, recovery objectives, and key-rotation procedures before accepting customer data at scale.
