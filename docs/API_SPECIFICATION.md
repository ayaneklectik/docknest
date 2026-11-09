# API Specification

## Implemented

### `POST /api/quotes`

Requires `name`, `email`, `phone`, a supported `service`, `requirements`, and optionally `company`, `billingPeriod`, and a honeypot `website` field. Email is validated as an address and phone must be a 7–40 character number with optional international prefix and common separators. Contact details are stored on the linked customer record. Accepted submissions return `201`; invalid JSON or fields return `400`; oversized requests return `413`; requests beyond the SQLite-backed fixed-window limit return `429`; storage errors return `500`.

### `POST /api/support/tickets`

Requires `name`, `email`, `phone`, `subject`, and `body`. The customer’s contact number is stored on the linked customer record.

### `GET /api/domains?domain={domain}`

Checks registry RDAP data for supported domain extensions and returns `available`, `unavailable`, or `manual_check_required`. Availability results are informational and must be reconfirmed by a registrar before purchase. Registry lookup failures return `502`.

### `POST /api/domains`

Creates a domain registration request and checks availability again before saving. Requires `domain`, `name`, `email`, and `phone`. Extensions without an HTTPS RDAP service are stored for manual review.

### `POST /api/payments`

Manual payment submissions require the order number, customer email, contact phone, payment method, reference, and amount. The number is saved to the customer record associated with the order.

### `PATCH /api/admin/quotes/{id}`

Requires a Better Auth session with `user.role === "admin"` and a matching same-origin `Origin` header. The body must contain a supported quotation `status`. The endpoint returns `404` for an unknown quotation and `403` for missing authorization.

### `GET/POST /api/auth/{...all}`

Handled by Better Auth. Public email/password registration is disabled in the application.

## Not implemented

Automated domain registration, payment-provider processing, and service provisioning are not available.
