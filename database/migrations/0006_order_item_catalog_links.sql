ALTER TABLE order_items ADD COLUMN product_id TEXT REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN addon_id TEXT REFERENCES addons(id) ON DELETE SET NULL;

CREATE INDEX order_items_product ON order_items(product_id);
CREATE INDEX order_items_addon ON order_items(addon_id);
