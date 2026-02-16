# 15 — Migration from Current Project

## Delta Analysis: Current vs New Architecture

### Tables That Map Directly

| Current Table | New Table | Notes |
|---|---|---|
| `profiles` | `profiles` | Add `tenant_id`, remove wine-specific fields |
| `user_roles` | (role on profiles) | Role moved to `profiles.role` column |
| `categories` | `categories` | Add `tenant_id`, keep syrve_group_id |
| `products` | `products` | Add `tenant_id`, add measurement unit refs |
| `product_barcodes` | `product_barcodes` | Add `tenant_id` |
| `stores` | `stores` + `warehouses` | Split into stores AND warehouses |
| `syrve_config` | `syrve_config` | Add `tenant_id` as PK, add accounting codes |
| `syrve_raw_objects` | `syrve_raw_objects` | Add `tenant_id` |
| `syrve_sync_runs` | `syrve_sync_runs` | Add `tenant_id` |
| `syrve_api_logs` | `syrve_api_logs` | Add `tenant_id` |
| `syrve_outbox_jobs` | `syrve_outbox_jobs` | Add `tenant_id` |
| `inventory_sessions` | `inventory_sessions` | Major expansion (warehouse_id, review workflow) |
| `inventory_baseline_items` | `inventory_baseline_items` | Add unit references |
| `inventory_count_events` | `inventory_count_events` | Add unit refs, container refs |
| `inventory_product_aggregates` | `inventory_product_aggregates` | Add unit tracking |
| `app_settings` | `app_settings` | Add `tenant_id` |
| `audit_logs` | `audit_logs` | Add `tenant_id` |

### Tables That Are Removed

| Current Table | Reason |
|---|---|
| `wines` | Replaced by universal `products` table |
| `wine_variants` | Replaced by `product_containers` |
| `wine_barcodes` | Merged into `product_barcodes` |
| `wine_images` | Simplified to products.images JSONB |
| `wine_producers` | Not needed in universal product model |
| `grape_varieties` | Wine-specific, excluded |
| `glass_dimensions` | Wine-specific, excluded |
| `volume_options` | Replaced by `measurement_units` |
| `locations` | Replaced by `warehouses` |
| `sub_locations` | Replaced by `storage_areas` |
| `inventory_items` | Replaced by event-sourced model |
| `inventory_movements` | Replaced by `inventory_count_events` |
| `stock_snapshots` | Replaced by `stock_levels` with as_of_date |
| `suppliers` | Future phase (counteragents from Syrve) |
| `ai_config` | Replaced by `tenant_modules` + AI model config |
| `ai_recognition_attempts` | Replaced by `ai_operations` |

### New Tables (Not in Current)

| New Table | Purpose |
|---|---|
| `tenants` | Multi-tenant root entity |
| `tenant_modules` | Billing module control |
| `integration_providers` | Available integration registry |
| `tenant_integrations` | Active integration connections |
| `org_nodes` | Department hierarchy from Syrve |
| `warehouses` | Warehouse/storage facilities |
| `storage_areas` | Zones within warehouses |
| `measurement_units` | All units from Syrve with conversions |
| `product_containers` | Packaging units (bottle, keg, case) |
| `product_integration_mappings` | External ID ↔ internal ID mapping |
| `stock_levels` | Per-warehouse, per-unit stock |
| `inventory_review_notes` | Manager comments per product |
| `inventory_product_adjustments` | Manager corrections with reasons |
| `inventory_variances` | Computed expected vs counted |
| `custom_field_definitions` | User-defined dynamic fields |

## Migration Strategy

### Recommended: Fresh Start on New Project

Since the architecture is fundamentally different (multi-tenant, warehouse-aware, measurement units), a fresh database on `aysdomtvoxizusmmxfug` is recommended.

**Steps**:
1. Run all migrations on new Supabase project
2. Deploy edge functions
3. Connect to Syrve and bootstrap data import
4. Update frontend to use new schema/hooks
5. Re-import any manually created data

### Data That Could Be Migrated

If needed, the following data from the current project could be migrated:
- `profiles` → new `profiles` (add tenant_id)
- `app_settings` → new `app_settings` (add tenant_id)
- `app_roles_config` → can inform initial role setup

### RLS Changes

| Aspect | Current | New |
|---|---|---|
| Scope | Role-based only | Tenant-scoped + role-based |
| Helper functions | `has_role()` | `auth.get_user_tenant_id()`, `auth.is_admin()`, `auth.has_role()` |
| Baseline visibility | Everyone | Manager-only (`inventory_baseline_items`) |
| Count insertion | Any auth user | Only during `in_progress` sessions |
| Admin pattern | `has_role('admin')` | `auth.is_admin() AND tenant_id = auth.get_user_tenant_id()` |
