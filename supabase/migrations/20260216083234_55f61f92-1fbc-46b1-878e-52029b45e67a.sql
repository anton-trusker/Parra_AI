
CREATE OR REPLACE VIEW public.v_stock_summary AS
SELECT
  p.id AS product_id,
  p.name,
  p.sku,
  p.code,
  p.category_id,
  c.name AS category_name,
  p.main_unit_id,
  p.unit_capacity,
  p.purchase_price,
  p.sale_price,
  p.syrve_data,
  p.synced_at,
  COALESCE(SUM(sl.quantity), 0) AS total_stock,
  COALESCE(SUM(sl.quantity * COALESCE(sl.unit_cost, 0)), 0) AS total_value
FROM products p
LEFT JOIN stock_levels sl ON sl.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_deleted = false
  AND p.is_active = true
  AND p.product_type = 'GOODS'
GROUP BY p.id, p.name, p.sku, p.code, p.category_id, c.name,
         p.main_unit_id, p.unit_capacity, p.purchase_price, p.sale_price,
         p.syrve_data, p.synced_at
HAVING COALESCE(SUM(sl.quantity), 0) > 0;
