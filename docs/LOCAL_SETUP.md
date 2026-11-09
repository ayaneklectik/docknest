# Local Setup

1. Install Node.js 20.9 or newer and npm.
2. Run `npm ci`.
3. Copy `.env.example` to `.env`. Replace the authentication secret with a random value of at least 32 characters.
4. Run `npm run db:migrate`.
5. Run `npm run admin:create` from a private interactive terminal. Enter the email when prompted and type a unique password of at least 14 characters at the hidden password prompt.
7. Run `npm run dev` and open <http://localhost:3000>.

The admin account bootstrap requires an initialized database, creates the first administrator directly on the host, and refuses to create another. Credentials are entered interactively and are never read from environment variables. Admins can create, delete, change roles, and reset passwords for customer and administrator accounts at `/admin/users`; password hashes and sessions are stored in SQLite. Public sign-up remains disabled. Manage website copy and imagery at `/admin/site`; each editor section links to where it appears publicly. At `/admin/products`, the selected category shows where a product will appear: Hosting on `/hosting`, Development and Maintenance on `/services`, and Domains on `/domains`; active products also appear in homepage service cards. At `/admin/content`, published blog posts appear on `/blog` and may appear on the homepage, while knowledge-base guides appear on `/knowledge-base`. Uploaded PNG, JPEG, and WebP files (up to 8 MB) are stored under `MEDIA_DIRECTORY` (default `./data/media`). Back up that directory with the SQLite database. The `.env` file, SQLite database, and media uploads are ignored by Git and excluded from delivery archives.
