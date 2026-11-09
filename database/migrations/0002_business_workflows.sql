CREATE TABLE products (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hosting', 'development', 'maintenance', 'domain')),
  description TEXT NOT NULL DEFAULT '',
  features_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_prices (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('BDT', 'USD')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'two-year', 'three-year', 'one-time')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, currency, billing_period)
);

CREATE TABLE addons (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addon_prices (
  id TEXT PRIMARY KEY NOT NULL,
  addon_id TEXT NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('BDT', 'USD')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'two-year', 'three-year', 'one-time')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  UNIQUE (addon_id, currency, billing_period)
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  phone TEXT,
  country TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quote_requests ADD COLUMN customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE quote_requests ADD COLUMN currency TEXT CHECK (currency IS NULL OR currency IN ('BDT', 'USD'));
ALTER TABLE quote_requests ADD COLUMN quoted_total_minor INTEGER CHECK (quoted_total_minor IS NULL OR quoted_total_minor >= 0);
ALTER TABLE quote_requests ADD COLUMN quote_expires_at TEXT;
ALTER TABLE quote_requests ADD COLUMN assigned_to TEXT REFERENCES user(id) ON DELETE SET NULL;

CREATE TABLE quote_items (
  id TEXT PRIMARY KEY NOT NULL,
  quote_id TEXT NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  addon_id TEXT REFERENCES addons(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_amount_minor INTEGER NOT NULL CHECK (unit_amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('BDT', 'USD')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'two-year', 'three-year', 'one-time')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quote_id TEXT UNIQUE REFERENCES quote_requests(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'payment_review', 'paid', 'cancelled', 'refunded')),
  currency TEXT NOT NULL CHECK (currency IN ('BDT', 'USD')),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_amount_minor INTEGER NOT NULL CHECK (unit_amount_minor >= 0),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'two-year', 'three-year', 'one-time'))
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  method TEXT NOT NULL CHECK (method IN ('manual_bank', 'manual_mobile', 'card_gateway', 'other')),
  reference TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('BDT', 'USD')),
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewer_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  reviewer_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'void')),
  currency TEXT NOT NULL CHECK (currency IN ('BDT', 'USD')),
  subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  due_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE development_projects (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quote_id TEXT REFERENCES quote_requests(id) ON DELETE SET NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inquiry'
    CHECK (status IN ('inquiry', 'quotation_sent', 'awaiting_payment', 'confirmed', 'in_progress', 'review', 'completed', 'cancelled')),
  due_at TEXT,
  assigned_to TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_messages (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  internal INTEGER NOT NULL DEFAULT 0 CHECK (internal IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_roles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE staff_permissions (
  role_id TEXT NOT NULL REFERENCES staff_roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE staff_assignments (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES staff_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  text_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE TABLE articles (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('blog', 'knowledge')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE domain_requests (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  domain_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'manual_check_required'
    CHECK (status IN ('manual_check_required', 'available', 'unavailable', 'registered', 'rejected')),
  registrar_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX products_category_active ON products(category, active, sort_order);
CREATE INDEX quote_items_quote ON quote_items(quote_id);
CREATE INDEX orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX payments_order_status ON payments(order_id, status);
CREATE INDEX invoices_order ON invoices(order_id);
CREATE INDEX projects_status_updated ON development_projects(status, updated_at DESC);
CREATE INDEX tickets_status_updated ON support_tickets(status, updated_at DESC);
CREATE INDEX messages_ticket_created ON support_messages(ticket_id, created_at);
CREATE INDEX audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX email_outbox_status_created ON email_outbox(status, created_at);
CREATE INDEX articles_kind_status ON articles(kind, status, published_at DESC);
CREATE INDEX domain_requests_name ON domain_requests(domain_name);

INSERT INTO staff_roles (id, name, description)
VALUES ('role-admin', 'admin', 'Full administrative access')
ON CONFLICT(name) DO NOTHING;
