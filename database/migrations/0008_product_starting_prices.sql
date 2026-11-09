ALTER TABLE products ADD COLUMN starting_price_bdt_minor INTEGER
  CHECK (starting_price_bdt_minor IS NULL OR starting_price_bdt_minor >= 0);

ALTER TABLE products ADD COLUMN starting_price_usd_minor INTEGER
  CHECK (starting_price_usd_minor IS NULL OR starting_price_usd_minor >= 0);

ALTER TABLE products ADD COLUMN starting_price_period TEXT NOT NULL DEFAULT 'monthly'
  CHECK (starting_price_period IN ('monthly', 'yearly', 'two-year', 'three-year', 'one-time'));
