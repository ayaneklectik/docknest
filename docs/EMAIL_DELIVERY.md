# Email delivery

Docknest writes customer acknowledgements and workflow notifications to the SQLite `email_outbox`. Queueing is not delivery. Messages are not sent until an operator configures SMTP and explicitly dispatches them.

## Configuration

Set these variables in the server environment:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

`SMTP_USER` and `SMTP_PASSWORD` must either both be set or both be empty. Port 465 uses implicit TLS; other ports use Nodemailer's SMTP transport behavior. Store credentials in a deployment secret manager, never in source control or an archive.

## Dispatch and recovery

- Inspect queue state at `/admin/email` with the `email.manage` permission.
- Dispatch one message from the admin page, or run `npm run email:dispatch` from a private server environment to process up to 25.
- A failed message records an error and can be requeued from the admin page.
- An in-progress claim older than ten minutes is returned to the queue when dispatch next runs. Run only one dispatch worker per database; a process crash after remote delivery but before local acknowledgement can still cause a duplicate on retry.
- The UI and CLI report missing SMTP configuration. Unconfigured messages remain queued; they are not marked sent.

Email messages contain plain text only. No external SMTP service has been configured or contacted by this project.
