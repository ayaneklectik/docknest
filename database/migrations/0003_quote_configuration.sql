ALTER TABLE quote_requests
  ADD COLUMN estimate_total_minor INTEGER
  CHECK (estimate_total_minor IS NULL OR estimate_total_minor >= 0);

ALTER TABLE quote_requests
  ADD COLUMN configuration_json TEXT NOT NULL DEFAULT '{}';
