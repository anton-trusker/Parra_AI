# Implementation Overview — New Supabase Project

## Target Supabase Project
- **URL**: `https://aysdomtvoxizusmmxfug.supabase.co`
- **Purpose**: Multi-tenant restaurant operations SaaS with Syrve integration

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: TENANT & SECURITY                             │
│  • tenants, profiles, user_roles, app_settings          │
│  • tenant_modules (billing control)                     │
│  • RLS policies with tenant_id isolation                │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: INTEGRATION & CANONICAL DATA                  │
│  • integration_providers, tenant_integrations           │
│  • categories, products, product_barcodes               │
│  • product_containers, product_modifiers                │
│  • product_integration_mappings                         │
│  • stock_levels (warehouse-aware)                       │
│  • measurement_units (from Syrve)                       │
│  • org_nodes, stores, warehouses, storage_areas         │
│  • syrve_config, syrve_raw_objects, syrve_sync_runs     │
│  • syrve_api_logs, syrve_outbox_jobs                    │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: APPLICATION & ENRICHMENT                      │
│  • inventory_sessions (event-sourced counting)          │
│  • inventory_baseline_items, inventory_count_events     │
│  • inventory_product_aggregates                         │
│  • inventory_review_notes, inventory_product_adjustments│
│  • inventory_variances                                  │
│  • ai_operations, custom_field_definitions              │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component      | Technology                                  |
|----------------|---------------------------------------------|
| Database       | PostgreSQL 15+ (Supabase-managed)           |
| Backend        | Supabase Edge Functions (TypeScript/Deno)   |
| Frontend       | React 18 + TypeScript + Vite                |
| State          | TanStack Query + Zustand                    |
| Authentication | Supabase Auth (JWT-based)                   |
| Storage        | Supabase Storage (S3-compatible)            |
| AI             | Gemini 2.5 Flash (free), GPT-5, DeepSeek   |

## Implementation Phases

### Phase 1A: Data Import (Foundation)
1. Connect to Syrve Server API
2. Import organization structure (departments, stores)
3. Import measurement units
4. Import warehouses & storage areas
5. Import categories (product groups)
6. Import products (GOODS type for inventory)
7. Import current stock levels per warehouse

### Phase 1B: Inventory Counting
1. Create inventory sessions (admin)
2. Load baseline from Syrve stock
3. Staff counting (manual, barcode, AI)
4. Real-time aggregation
5. Manager review & adjustment
6. Approval workflow

### Phase 1C: Syrve Document Submission
1. Convert counted units to Syrve units
2. Build XML incomingInventory document
3. Submit via outbox pattern
4. Track Syrve document ID
5. Retry logic for failed submissions

## Excluded Features (Per Requirements)
- ❌ Wine-specific functionality
- ❌ Locations/sub-locations hierarchy (replaced by warehouses/storage_areas)
- ❌ Mock/seed data (all real integration data)
- ❌ Automatic enrichment workflows
- ❌ TheFork/SevenRooms booking (future phase)
- ❌ Telegram bot integration (future phase)
- ❌ Stripe billing integration (future phase)

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 00 | This file | Overview and architecture |
| 01 | database-schema.md | Complete SQL migrations |
| 02 | enums-and-types.md | PostgreSQL enums and types |
| 03 | tenant-security-layer.md | Multi-tenant isolation |
| 04 | syrve-integration-tables.md | Syrve-specific tables |
| 05 | organization-warehouses.md | Org nodes, stores, warehouses |
| 06 | measurement-units.md | Units table and conversion |
| 07 | catalog-products.md | Products, barcodes, containers |
| 08 | stock-levels.md | Warehouse-aware stock |
| 09 | inventory-operations.md | Sessions, counting, review |
| 10 | rls-policies.md | Complete RLS policy set |
| 11 | triggers-functions.md | Triggers, audit, search |
| 12 | edge-functions.md | Edge function specs |
| 13 | api-endpoints.md | API surface documentation |
| 14 | react-hooks.md | Frontend hooks |
| 15 | migration-from-current.md | Delta analysis |
