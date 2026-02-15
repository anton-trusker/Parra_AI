# 01 — Complete Database Schema (Migration Order)

## Migration File Structure

```
supabase/migrations/
├── 20260215000001_extensions.sql
├── 20260215000002_enums_types.sql
├── 20260215000003_layer1_tenant_security.sql
├── 20260215000004_layer2_integration_canonical.sql
├── 20260215000005_syrve_specific.sql
├── 20260215000006_organization_warehouses.sql
├── 20260215000007_measurement_units.sql
├── 20260215000008_layer3_inventory.sql
├── 20260215000009_ai_custom_fields.sql
├── 20260215000010_rls_policies.sql
├── 20260215000011_triggers_functions.sql
├── 20260215000012_indexes_performance.sql
└── 20260215000013_seed_data.sql
```

## Migration 1: Extensions

```sql
-- 20260215000001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

## Migration 2: Enums & Types

See `02-enums-and-types.md` for complete enum definitions.

## Migration 3: Layer 1 — Tenant & Security

See `03-tenant-security-layer.md` for:
- `tenants` table
- `profiles` table
- `user_roles` table (removed — role moved to profiles)
- `app_settings` table
- `tenant_modules` table

## Migration 4: Layer 2 — Integration & Canonical

See `04-syrve-integration-tables.md` and `07-catalog-products.md` for:
- `integration_providers` table
- `tenant_integrations` table
- `categories` table
- `products` table
- `product_integration_mappings` table
- `product_barcodes` table
- `product_containers` table
- `product_modifiers` table

## Migration 5: Syrve-Specific

See `04-syrve-integration-tables.md` for:
- `syrve_config` table
- `syrve_raw_objects` table
- `syrve_sync_runs` table
- `syrve_api_logs` table
- `syrve_outbox_jobs` table

## Migration 6: Organization & Warehouses

See `05-organization-warehouses.md` for:
- `org_nodes` table
- `stores` table
- `warehouses` table
- `storage_areas` table

## Migration 7: Measurement Units

See `06-measurement-units.md` for:
- `measurement_units` table
- `convert_quantity()` function
- `get_unit_id_by_name()` function

## Migration 8: Layer 3 — Inventory Operations

See `09-inventory-operations.md` for:
- `inventory_sessions` table
- `inventory_baseline_items` table
- `inventory_count_events` table
- `inventory_product_aggregates` table
- `inventory_review_notes` table
- `inventory_product_adjustments` table
- `inventory_variances` table

## Migration 9: AI & Custom Fields

See source docs for:
- `ai_operations` table
- `custom_field_definitions` table

## Migration 10–13: RLS, Triggers, Indexes, Seed

See documents `10-rls-policies.md`, `11-triggers-functions.md`.

## Key Table Dependencies (Creation Order)

```
1. tenants
2. profiles (→ tenants, → auth.users)
3. app_settings (→ tenants)
4. tenant_modules (→ tenants)
5. integration_providers
6. tenant_integrations (→ tenants, → integration_providers)
7. org_nodes (→ tenants, self-ref)
8. stores (→ tenants, → org_nodes)
9. measurement_units (→ tenants, self-ref)
10. warehouses (→ tenants, → stores, → org_nodes)
11. storage_areas (→ tenants, → warehouses, self-ref)
12. categories (→ tenants, self-ref)
13. products (→ tenants, → categories, → measurement_units, self-ref)
14. product_barcodes (→ tenants, → products)
15. product_containers (→ tenants, → products, → measurement_units)
16. product_modifiers (→ products)
17. product_integration_mappings (→ tenants, → products, → tenant_integrations)
18. stock_levels (→ tenants, → products, → warehouses, → measurement_units)
19. syrve_config (→ tenants)
20. syrve_raw_objects (→ tenants)
21. syrve_sync_runs (→ tenants)
22. syrve_api_logs (→ syrve_sync_runs)
23. inventory_sessions (→ tenants, → stores/warehouses, → profiles)
24. inventory_baseline_items (→ tenants, → inventory_sessions, → products, → measurement_units)
25. inventory_count_events (→ tenants, → inventory_sessions, → products, → profiles, → measurement_units)
26. inventory_product_aggregates (→ tenants, → inventory_sessions, → products)
27. inventory_review_notes (→ tenants, → inventory_sessions, → products, → profiles)
28. inventory_product_adjustments (→ tenants, → inventory_sessions, → products, → measurement_units, → profiles)
29. inventory_variances (→ tenants, → inventory_sessions, → products)
30. syrve_outbox_jobs (→ tenants, → inventory_sessions)
31. ai_operations (→ tenants)
32. custom_field_definitions (→ tenants)
33. audit_logs (→ tenants, → profiles)
```
