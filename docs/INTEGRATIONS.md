# Integrations

No external integrations are active in this MVP. No account credentials or provider accounts were accessed.

| Integration | Current status | Next step |
|---|---|---|
| Payment providers | Not connected | Select provider(s), research official API docs, and implement pending/review states separately from provisioning. |
| Domain lookup | IANA RDAP bootstrap and HTTPS registry RDAP | Availability checks are informational; select a registrar and integrate its official API before offering registration or pricing. Extensions without RDAP remain manual-check requests. |
| cPanel / WHM | Not connected | Validate license and API requirements before a separately quoted option is offered. |
| Dockploy / VPS providers | Not connected | Keep internal infrastructure controls separate from customer-facing access. |
| SMTP / transactional email | Not connected | Select a provider and configure secret-backed credentials, delivery, bounce handling, and templates. |
| Cloudflare | Not connected | Implement only required functionality using current official documentation and scoped credentials. |
| Analytics / chatbot / WhatsApp | Not connected | Decide privacy, data retention, and provider requirements before selection. |
| GitHub | Optional future integration | Not required for local development or deployment. |

Pricing, credentials, licenses, and live service claims must not be added until administrators configure and verify the corresponding integration.
