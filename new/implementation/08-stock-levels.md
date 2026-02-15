# 08 — Stock Levels (Warehouse-Aware)

## Overview

Stock is tracked per product per warehouse, with unit tracking and historical snapshots.

## Tables

### stock_levels

```sql
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  storage_area_id UUID REFERENCES storage_areas(id) ON DELETE SET NULL,

  -- Quantity
  quantity NUMERIC(20,6) NOT NULL DEFAULT 0,
  unit_id UUID NOT NULL REFERENCES measurement_units(id),

  -- Converted to product's main unit
  quantity_in_product_unit NUMERIC(20,6),

  -- Value
  unit_cost NUMERIC(15,4),
  total_value NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Timestamp
  as_of_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source
  source TEXT DEFAULT 'syrve',
  sync_run_id UUID REFERENCES syrve_sync_runs(id),

  -- Reconciliation
  last_counted_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_id, warehouse_id, as_of_date)
);

CREATE INDEX idx_stock_product_warehouse ON stock_levels(tenant_id, product_id, warehouse_id);
CREATE INDEX idx_stock_warehouse ON stock_levels(tenant_id, warehouse_id);
CREATE INDEX idx_stock_positive ON stock_levels(tenant_id, warehouse_id) WHERE quantity > 0;
CREATE INDEX idx_stock_as_of_date ON stock_levels(tenant_id, as_of_date DESC);
```

## Import from Syrve

```
API: GET /v2/entities/products/stock-and-sales?storeIds={uuid}&productIds={uuids}

Response per product:
- productId: UUID
- storeId: UUID
- amount: decimal (current stock in product's main unit)
- amountUnit: { id, name }
```

### Batching Strategy

```typescript
// Split products into batches of 500
const batches = chunk(allProductIds, 500);
for (const batch of batches) {
  const stockData = await fetchStock(storeId, batch.join(','));
  await processStock(stockData);
  await sleep(100); // Rate limiting
}
```

## Stock Filtering for Inventory

When starting an inventory session, show ONLY products that match ALL:
- `product_type = 'GOODS'`
- `track_inventory = true`
- `not_in_store_movement = false`
- `is_active = true`
- `is_deleted = false`
- `stock_levels.quantity > 0` (positive stock in selected warehouse)

```sql
CREATE OR REPLACE FUNCTION get_countable_products(
  p_tenant_id UUID,
  p_warehouse_id UUID,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  category_name TEXT,
  current_stock NUMERIC,
  stock_unit TEXT,
  counting_unit TEXT,
  container_type TEXT,
  container_capacity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.sku, c.name,
    sl.quantity, mu_stock.short_name,
    mu_count.short_name, p.container_type, p.container_capacity
  FROM products p
  INNER JOIN stock_levels sl ON sl.product_id = p.id
    AND sl.warehouse_id = p_warehouse_id
    AND sl.tenant_id = p_tenant_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN measurement_units mu_stock ON mu_stock.id = p.main_unit_id
  LEFT JOIN measurement_units mu_count ON mu_count.id = p.counting_unit_id
  WHERE p.tenant_id = p_tenant_id
    AND p.product_type = 'GOODS'
    AND p.track_inventory = true
    AND p.not_in_store_movement = false
    AND p.is_active = true
    AND p.is_deleted = false
    AND sl.quantity > 0
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
  ORDER BY c.name, p.name;
END;
$$ LANGUAGE plpgsql STABLE;
```
