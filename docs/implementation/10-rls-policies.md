# 10 — Complete RLS Policy Set

## Philosophy

1. **Tenant Isolation**: Every query filtered by `tenant_id`
2. **Role-Based Access**: owner/admin/manager/staff/viewer hierarchy
3. **Default Deny**: No access unless explicitly granted
4. **Security Definer Functions**: Helper functions bypass RLS for lookups

## Enable RLS on All Tables

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_raw_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_outbox_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_baseline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_product_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_review_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_product_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_variances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

## Policies by Table

### tenants
```sql
CREATE POLICY "Users view own tenant" ON tenants FOR SELECT
  USING (id = auth.get_user_tenant_id());
CREATE POLICY "Owners update own tenant" ON tenants FOR UPDATE
  USING (auth.has_role('owner') AND id = auth.get_user_tenant_id());
```

### profiles
```sql
CREATE POLICY "Users view own profile" ON profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "Admins view all tenant profiles" ON profiles FOR SELECT
  USING (auth.is_admin() AND tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Admins insert profiles" ON profiles FOR INSERT
  WITH CHECK (auth.is_admin() AND tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Admins update profiles" ON profiles FOR UPDATE
  USING (auth.is_admin() AND tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
  USING (id = auth.uid());
```

### Generic tenant-scoped read pattern (apply to most tables)
```sql
-- Categories, products, stock_levels, measurement_units, org_nodes,
-- stores, warehouses, storage_areas, product_barcodes, product_containers
CREATE POLICY "Tenant read" ON <table> FOR SELECT
  USING (tenant_id = auth.get_user_tenant_id());

-- Admin/Manager write
CREATE POLICY "Manager write" ON <table> FOR ALL
  USING (auth.is_manager_or_above() AND tenant_id = auth.get_user_tenant_id())
  WITH CHECK (tenant_id = auth.get_user_tenant_id());
```

### inventory_sessions
```sql
CREATE POLICY "Tenant read sessions" ON inventory_sessions FOR SELECT
  USING (tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Managers create sessions" ON inventory_sessions FOR INSERT
  WITH CHECK (auth.is_manager_or_above() AND tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Managers update sessions" ON inventory_sessions FOR UPDATE
  USING (auth.is_manager_or_above() AND tenant_id = auth.get_user_tenant_id());
```

### inventory_baseline_items (Manager-only visibility)
```sql
CREATE POLICY "Managers view baseline" ON inventory_baseline_items FOR SELECT
  USING (auth.is_manager_or_above() AND tenant_id = auth.get_user_tenant_id());
```

### inventory_count_events (Staff insert during active sessions)
```sql
CREATE POLICY "Tenant read counts" ON inventory_count_events FOR SELECT
  USING (tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Staff insert counts" ON inventory_count_events FOR INSERT
  WITH CHECK (
    tenant_id = auth.get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM inventory_sessions
      WHERE id = session_id AND status = 'in_progress'
    )
  );
```

### syrve_config (Admin-only)
```sql
CREATE POLICY "Admin manage syrve_config" ON syrve_config FOR ALL
  USING (auth.is_admin() AND tenant_id = auth.get_user_tenant_id())
  WITH CHECK (tenant_id = auth.get_user_tenant_id());
CREATE POLICY "Tenant read syrve_config" ON syrve_config FOR SELECT
  USING (tenant_id = auth.get_user_tenant_id());
```

### integration_providers (Public read)
```sql
CREATE POLICY "Anyone view providers" ON integration_providers FOR SELECT
  USING (true);
```
