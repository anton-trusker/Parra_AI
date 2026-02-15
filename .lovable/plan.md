

# Store Documents and Create New Supabase Project Implementation Plan

## Overview

This plan covers two main tasks:
1. Store the three uploaded specification documents in the `new/syrve_integration` folder
2. Create a new organized documentation folder with implementation guides for building the full Syrve integration on a **new Supabase project** (`aysdomtvoxizusmmxfug`)

The uploaded documents define a significantly expanded architecture compared to the current project -- moving from a single-tenant wine inventory system to a **multi-tenant restaurant operations SaaS platform** with measurement units, warehouses, storage areas, multi-integration support, billing, and more.

---

## Part 1: Store Uploaded Documents

Copy the three uploaded specification documents into `new/syrve_integration/`:

| Source File | Destination |
|---|---|
| `Complete-Platform-Database-Specification.md` | `new/syrve_integration/complete_platform_db_spec.md` |
| `Phase_1_Extended_Integration.md` | `new/syrve_integration/phase_1_extended_integration.md` |
| `Phase_1A_Syrve_Integration_Data_Import_-_Complete_Technical_Specification.md` | `new/syrve_integration/phase_1a_data_import_spec.md` |

---

## Part 2: Create Implementation Documentation

Create a new folder `new/implementation/` with structured, actionable documents that break down the full integration into implementable phases for the new Supabase project.

### Document Structure

```
new/implementation/
  00-overview.md              -- Master index, architecture summary, new project details
  01-database-schema.md       -- Complete SQL migrations for the new Supabase project
  02-enums-and-types.md       -- All custom PostgreSQL enums and types
  03-tenant-security-layer.md -- Tenants, profiles, user_roles, RLS policies, helper functions
  04-syrve-integration-tables.md  -- syrve_config, raw_objects, sync_runs, api_logs, outbox
  05-organization-warehouses.md   -- org_nodes, stores, warehouses, storage_areas
  06-measurement-units.md     -- measurement_units table, conversion functions, import logic
  07-catalog-products.md      -- categories, products, barcodes, containers, modifiers, mappings
  08-stock-levels.md          -- stock_levels (warehouse-aware), stock history
  09-inventory-operations.md  -- sessions, baseline, count_events, aggregates, review_notes, adjustments, variances
  10-rls-policies.md          -- Complete RLS policy set for all tables
  11-triggers-functions.md    -- Aggregate triggers, audit triggers, search vectors, helper functions
  12-edge-functions.md        -- All edge function specifications (connect-test, sync-bootstrap, stock-snapshot, submit-inventory, AI recognition, outbox processor)
  13-api-endpoints.md         -- Complete API surface with request/response contracts
  14-react-hooks.md           -- Frontend hooks (useProducts, useInventory, useStores, useAI, useSyrveSync)
  15-migration-from-current.md -- Delta analysis: what exists vs what's needed, migration path
```

### Key Content Per Document

**00-overview.md**: New Supabase project URL, three-layer architecture diagram, technology stack, implementation phases (Phase 1A: Data Import, Phase 1B: Inventory Counting, Phase 1C: Syrve Document Submission), excluded features list.

**01-database-schema.md**: Ordered SQL migration files ready to run on the new project. Migration order:
1. Extensions (pgcrypto, uuid-ossp, pg_trgm, btree_gin)
2. Enums and types
3. Layer 1: Tenants, profiles, user_roles, app_settings, tenant_modules
4. Layer 2: Integration providers, tenant_integrations, categories, products, product_barcodes, product_containers, product_modifiers, product_integration_mappings, stock_levels
5. Syrve-specific: syrve_config, syrve_raw_objects, syrve_sync_runs, syrve_api_logs, syrve_outbox_jobs
6. Organization: org_nodes, stores, warehouses, storage_areas
7. Measurement: measurement_units
8. Layer 3: inventory_sessions, inventory_baseline_items, inventory_count_events, inventory_product_aggregates, inventory_review_notes, inventory_product_adjustments, inventory_variances
9. AI: ai_operations, custom_field_definitions
10. Indexes and performance optimizations

**03-tenant-security-layer.md**: Multi-tenant isolation using `tenant_id` on all tables, `auth.get_user_tenant_id()` helper function, `auth.is_admin()` and `auth.has_role()` functions, RLS policy patterns.

**05-organization-warehouses.md**: Syrve store = warehouse mapping, warehouse types (MAIN, STORE, PRODUCTION, EXTERNAL, VIRTUAL), storage areas (BAR, CELLAR, KITCHEN, etc.), hierarchy relationships.

**06-measurement-units.md**: Import ALL units from Syrve `/units/list`, conversion factor system with base units, `convert_quantity()` function, `convert_count_to_syrve_unit()` function for inventory submission.

**09-inventory-operations.md**: Complete lifecycle -- draft -> in_progress -> counting_complete -> under_review -> pending_approval -> approved -> sending -> synced. Event-sourced counting model, manager review notes and adjustments, variance computation.

**12-edge-functions.md**: Specifications for:
- `syrve-connect-test`: Test credentials, fetch stores/departments
- `syrve-sync-bootstrap`: Full data import (org -> units -> categories -> products -> stock)
- `syrve-sync-products`: Incremental product sync
- `syrve-stock-snapshot`: Fetch current stock per warehouse
- `syrve-submit-inventory`: Build XML, submit via outbox pattern
- `process-outbox-jobs`: Background worker for reliable Syrve document delivery
- `ai-recognize-product`: Multi-model AI image recognition

**15-migration-from-current.md**: Maps current project tables to new schema, identifies gaps (no tenants, no measurement_units, no warehouses, no stock_levels, simplified inventory model), recommends migration strategy.

---

## Technical Details

### New Supabase Project
- URL: `https://aysdomtvoxizusmmxfug.supabase.co`
- This is a separate project from the current one (`uzymtgcklmunettdiucs`)
- The documentation will contain ready-to-run SQL for the new project

### Key Architectural Differences from Current Project

| Aspect | Current Project | New Architecture |
|---|---|---|
| Multi-tenancy | None (single tenant) | Full tenant isolation via `tenant_id` |
| Stores/Warehouses | Simple `stores` table | `org_nodes` + `stores` + `warehouses` + `storage_areas` |
| Measurement Units | None (hardcoded) | Full `measurement_units` table with conversions |
| Stock Tracking | `current_stock` field on products | Separate `stock_levels` table (per warehouse, per unit) |
| Product Model | Wine-focused with `wines` table | Universal product model with `product_type` enum |
| Inventory | Basic event logging | Full lifecycle with review notes, adjustments, variances |
| Integration | Syrve-only, tightly coupled | Multi-provider adapter pattern |
| RLS | Role-based (admin/super_admin) | Tenant-scoped + role-based |

### Files Created (Total: 18)
- 3 copied specification documents
- 15 new implementation guide documents

### No Code Changes
This plan only creates documentation files. No application code, database migrations, or edge functions are modified.

