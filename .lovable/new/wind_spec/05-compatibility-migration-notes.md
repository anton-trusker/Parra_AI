# Compatibility + Migration Notes (Current Repo → New Supabase Project)

This repo contains **existing assumptions** in frontend code (`src/*`) and generated Supabase types (`src/integrations/supabase/types.ts`) that do **not** fully match the newer, Syrve-first schema described in `doc/new/syrve_integration/supabase_syrve_db.md` and the new `wind_spec/*` documents.

This document explains:
- what the current code expects
- what the new Supabase project schema contains
- recommended migration strategy

---

## 1) Current repo expectations (observed)

### Auth
- Login is by `loginName + password` in UI.
- Implementation converts login name to a **synthetic email**:
  - `loginName@inventory.local`

### Tables referenced by frontend
Examples (not exhaustive):
- `roles` (loaded in `settingsStore.fetchRoles()`)
- `profiles` (loaded in `authStore.login()` with join to roles)
- `inventory_sessions`
- `inventory_items` (mutable upsert logic in `sessionStore.submitCount()`)
- Syrve config table in code: `integration_syrve_config`

### Important: Edge Functions
- Frontend calls `supabase.functions.invoke('syrve-connect-test')`.
- Local repo folder `supabase/functions` is currently empty.

---

## 2) New Supabase project target (recommended)

The new schema described in `wind_spec/*` is:
- **single client platform** — one restaurant per Supabase project, no `business_id` columns
- **singleton tables** for config: `business_profile`, `app_settings`, `syrve_config`, `ai_config`
- **Syrve canonical catalog** in `categories` + `products` (+ `product_barcodes`)
- **event-sourced inventory**:
  - baseline expected values: `inventory_baseline_items`
  - append-only staff counts: `inventory_count_events`
  - manager UI speed: `inventory_product_aggregates`
- Syrve integration:
  - `syrve_config` (singleton)
  - `syrve_raw_objects`, `syrve_sync_runs`, `syrve_api_logs`
  - `syrve_outbox_jobs`

---

## 3) Mapping: old → new

### 3.1 Syrve config
- Old: `integration_syrve_config`
- New: `syrve_config`

Recommendation:
- either rename table in the new project to match frontend, or update frontend to use `syrve_config`.

### 3.2 Inventory counting
- Old: `inventory_items`
  - one row per (session, wine/product)
  - mutable update/upsert
- New:
  - `inventory_count_events` (append-only)
  - `inventory_product_aggregates` (derived totals)

Recommendation:
- Update frontend counting logic to insert into `inventory_count_events` and read aggregates.
- Keep `inventory_items` only if you need short-term backward compatibility.

### 3.3 Wine vs generic products
The new product documentation states the platform is generic. However, current code/types still contain `wines` and `wine_variants`.

Options:
- **Option A (recommended)**: use `products` as primary entity everywhere; keep `wines` as optional 1:1 enrichment.
- **Option B**: keep legacy wine tables in parallel and slowly migrate.

---

## 4) Migration strategy (practical)

### Phase 1 — Stand up new Supabase project (schema + RLS + functions)
- Apply schema migrations (as in `wind_spec`)
- Deploy Edge Functions:
  - `syrve-connect-test`, `syrve-save-config`, `syrve-bootstrap-sync`, `syrve-sync-products`
  - `inventory-create-session`, `inventory-load-baseline`, `inventory-submit-to-syrve`, `syrve-process-outbox`
  - AI functions (`ai-label-recognition`, `compute-label-hash`, `admin-reindex-products`)

### Phase 2 — Frontend compatibility shim
Pick one:
- **Shim in DB**: create compatibility views with the old names
  - e.g. `create view integration_syrve_config as select ... from syrve_config`
- **Shim in code**: update frontend stores to call new tables and functions

### Phase 3 — Remove legacy tables
- after frontend uses events/aggregates
- after Syrve sync fully writes canonical tables

---

## 5) Immediate doc-driven changes to `wind_spec`
Completed:
- Removed all `business_id` columns — single client platform
- Converted config tables to singletons (`business_profile`, `app_settings`, `syrve_config`, `ai_config`)
- Simplified RLS to role-based only (no tenant isolation)
- Added `06-settings-pages-logic.md` with complete settings specification
- Added `product_search_index` (pgvector) table for OCR/embedding pipeline
- Harmonized Edge Function names across docs

