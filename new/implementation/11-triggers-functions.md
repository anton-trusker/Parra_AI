# 11 — Triggers & Functions

## updated_at Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_sessions_updated_at BEFORE UPDATE ON inventory_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- (apply to all tables with updated_at column)
```

## Inventory Aggregate Trigger

```sql
CREATE OR REPLACE FUNCTION update_inventory_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory_product_aggregates (
    tenant_id, session_id, product_id,
    total_counted, counting_unit_id,
    total_in_product_unit, unique_counters,
    last_counted_at, last_counted_by, updated_at
  )
  SELECT
    NEW.tenant_id, NEW.session_id, NEW.product_id,
    SUM(e.quantity_counted),
    NEW.counting_unit_id,
    SUM(COALESCE(e.quantity_in_product_unit, 0)),
    COUNT(DISTINCT e.counted_by),
    MAX(e.counted_at),
    NEW.counted_by,
    NOW()
  FROM inventory_count_events e
  WHERE e.session_id = NEW.session_id
    AND e.product_id = NEW.product_id
    AND e.tenant_id = NEW.tenant_id
  GROUP BY e.tenant_id, e.session_id, e.product_id
  ON CONFLICT (session_id, product_id) DO UPDATE SET
    total_counted = EXCLUDED.total_counted,
    total_in_product_unit = EXCLUDED.total_in_product_unit,
    unique_counters = EXCLUDED.unique_counters,
    last_counted_at = EXCLUDED.last_counted_at,
    last_counted_by = EXCLUDED.last_counted_by,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory_aggregate
  AFTER INSERT ON inventory_count_events
  FOR EACH ROW EXECUTE FUNCTION update_inventory_aggregate();
```

## Product Search Vector Trigger

```sql
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.sku, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
```

## Audit Log Function

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD.tenant_id;
  ELSE
    v_tenant_id := NEW.tenant_id;
  END IF;

  INSERT INTO audit_logs (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    v_tenant_id, auth.uid(), TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER trg_audit_inventory_sessions AFTER INSERT OR UPDATE OR DELETE ON inventory_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

## AI Usage Counter

```sql
CREATE OR REPLACE FUNCTION increment_ai_usage(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tenants SET monthly_ai_scans_used = monthly_ai_scans_used + 1
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;
```
