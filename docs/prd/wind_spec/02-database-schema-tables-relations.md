# Supabase Database Schema — Tables, Columns, Relations

This document defines the **complete Supabase Postgres schema** for a new Supabase project.

## Naming conventions
- Primary keys: `id uuid` (default `gen_random_uuid()`)
- External IDs:
  - Syrve IDs stored as `uuid` where Syrve returns UUID
- JSON payloads: `jsonb`
- Timestamps: `timestamptz`

## Extensions
- `pgcrypto` (UUID generation)
- `uuid-ossp` (optional)
- `pgvector` (if using embedding search for label recognition)
- `vault` (for secret management - Syrve credentials, AI keys)

---

# 1) User layer

## 1.1 `business_profile`
Single business settings (singleton table, one row only).

- `id uuid pk` (fixed value, e.g., '00000000-0000-0000-0000-000000000001')
- `name text not null` (restaurant name)
- `legal_name text null`
- `country text null`
- `city text null`
- `address text null`
- `currency text not null default 'EUR'`
- `language text not null default 'en'`
- `timezone text not null default 'Europe/Lisbon'`
- `settings jsonb not null default '{}'`
- `is_active boolean not null default true`
- `logo_url text null` (business logo for UI)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Relations:
- `business_profile (1) -> (N) profiles`
- `business_profile (1) -> (1) syrve_config`

## 1.2 `profiles`
One row per authenticated user.

- `id uuid pk` references `auth.users(id)` on delete cascade
- `full_name text null`
- `email text null` (optional mirror of auth email)
- `login_name text null` (for username login; must be unique)
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- unique `login_name` where `login_name is not null`

## 1.3 `roles`
Role definition table used by current frontend (`settingsStore.ts`) and `ProtectedRoute`.

- `id uuid pk`
- `name text not null unique` (e.g. `super_admin`, `manager`, `staff`)
- `color text null`
- `permissions jsonb not null default '{}'`
- `is_system_role boolean not null default false`
- `is_super_admin boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 1.4 `user_roles`
User↔role assignments (supports multiple roles per user).

- `id uuid pk`
- `user_id uuid not null` references `profiles(id)` on delete cascade
- `role_id uuid not null` references `roles(id)` on delete cascade
- `created_at timestamptz not null default now()`

Constraints:
- unique `(user_id, role_id)`

---

# 2) Logging + settings

## 2.1 `app_settings`
Single row application settings (singleton, one row only).

- `id uuid pk` (fixed value, e.g., '00000000-0000-0000-0000-000000000001')
- `inventory_requires_approval boolean not null default true`
- `ai_recognition_enabled boolean not null default true`
- `default_glass_id uuid null` references `glass_dimensions(id)`
- `default_bottle_size_ml numeric null`
- `settings jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 2.2 `feature_flags`
- `id uuid pk`
- `flag_key text not null`
- `enabled boolean not null default false`
- `meta jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- unique `flag_key`

## 2.3 `audit_logs`
Append-only.

- `id uuid pk`
- `actor_user_id uuid null` references `profiles(id)`
- `action text not null`
- `entity_type text null`
- `entity_id uuid null`
- `details jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

## 2.4 `error_logs`
- `id uuid pk`
- `severity text not null default 'error'`
- `source text not null default 'app'`
- `message text not null`
- `context jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

---

# 3) Syrve integration (mirror + control)

## 3.1 `syrve_config` (singleton)
- `id uuid pk` (fixed value, e.g., '00000000-0000-0000-0000-000000000001')
- `server_url text not null`
- `api_login text not null`
- `api_password_encrypted text not null`
- `default_store_id uuid null` (Syrve store UUID)
- `default_department_id uuid null` (optional)
- `selected_category_ids uuid[] null` (optional)
- `connection_status text not null default 'disconnected'`
- `connection_tested_at timestamptz null`
- `last_sync_at timestamptz null`
- `sync_lock_until timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 3.2 `syrve_raw_objects`
Lossless mirror.

- `id uuid pk`
- `entity_type text not null` (department|store|group|product_group|product|terminal|...)
- `syrve_id uuid not null`
- `payload jsonb not null`
- `payload_hash text not null`
- `synced_at timestamptz not null default now()`
- `is_deleted boolean not null default false`

Constraints:
- unique `(entity_type, syrve_id, payload_hash)`

Indexes:
- `(entity_type, syrve_id)`

## 3.3 `syrve_sync_runs`
- `id uuid pk`
- `run_type text not null` (bootstrap|products_sync|categories_sync|stores_sync|stock_snapshot|inventory_check|inventory_commit)
- `status text not null default 'pending'` (pending|processing|success|failed)
- `stats jsonb not null default '{}'`
- `error text null`
- `started_at timestamptz not null default now()`
- `finished_at timestamptz null`

## 3.4 `syrve_api_logs`
- `id uuid pk`
- `action_type text not null`
- `status text not null`
- `request_payload text null`
- `response_payload text null`
- `error_message text null`
- `created_at timestamptz not null default now()`

## 3.5 `syrve_outbox_jobs`
Idempotent job queue.

- `id uuid pk`
- `session_id uuid null` references `inventory_sessions(id)` on delete cascade
- `job_type text not null` (inventory_check|inventory_commit)
- `payload_xml text not null`
- `payload_hash text not null`
- `status text not null default 'pending'` (pending|processing|success|failed)
- `attempts int not null default 0`
- `last_error text null`
- `last_attempt_at timestamptz null`
- `response_xml text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- unique `(job_type, payload_hash)`

---

# 4) Organization + catalog (canonical)

## 4.1 `org_nodes`
- `id uuid pk`
- `syrve_id uuid not null`
- `node_type text not null` (corporation|department|store|sale_point|...)
- `parent_id uuid null` references `org_nodes(id)`
- `name text not null`
- `code text null`
- `is_active boolean not null default true`
- `synced_at timestamptz null`
- `syrve_data jsonb not null default '{}'`

Constraints:
- unique `syrve_id`

## 4.2 `stores`
- `id uuid pk`
- `syrve_store_id uuid not null`
- `org_node_id uuid null` references `org_nodes(id)`
- `name text not null`
- `code text null`
- `is_active boolean not null default true`
- `synced_at timestamptz null`

Constraints:
- unique `syrve_store_id`

## 4.3 `categories`
- `id uuid pk`
- `syrve_group_id uuid not null`
- `parent_id uuid null` references `categories(id)`
- `name text not null`
- `sort_order int not null default 0`
- `is_in_scope boolean not null default true`
- `is_active boolean not null default true`
- `default_glass_id uuid null` references `glass_dimensions(id)`
- `synced_at timestamptz null`
- `syrve_data jsonb not null default '{}'`

Constraints:
- unique `syrve_group_id`

## 4.4 `products`
Canonical Syrve product mirror + app metadata.

- `id uuid pk`
- `syrve_product_id uuid not null`
- `category_id uuid null` references `categories(id)`
- `name text not null`
- `description text null`
- `sku text null`
- `code text null`
- `product_type text null`
- `unit_name text null`
- `unit_capacity_liters numeric null`
- `default_sale_price numeric null`
- `not_in_store_movement boolean not null default false`
- `is_active boolean not null default true`
- `is_deleted boolean not null default false`
- `is_countable boolean not null default true` (include in inventory sessions)
- `par_level numeric null` (minimum stock threshold)
- `default_location text null` (primary storage location)
- `stock_status text null` (computed: in_stock|low_stock|out_of_stock)
- `synced_at timestamptz null`
- `syrve_data jsonb not null default '{}'`
- `metadata jsonb not null default '{}'`

Constraints:
- unique `syrve_product_id`

Indexes:
- `(category_id)`
- `(name)` (and optionally trigram index)

## 4.5 `product_barcodes`
- `id uuid pk`
- `product_id uuid not null` references `products(id)`
- `barcode text not null`
- `source text not null default 'syrve'` (syrve|manual|ai)
- `confidence numeric null`
- `is_primary boolean not null default false`
- `created_at timestamptz not null default now()`

Constraints:
- unique `barcode`

---

# 5) Enrichment layer (wine-first but generic)

## 5.1 `wines` (optional 1:1 extension)
Only create when product is wine-like.

- `product_id uuid pk` references `products(id)`
- `producer text null`
- `vintage int null`
- `country text null`
- `region text null`
- `appellation text null`
- `alcohol_content numeric null`
- `volume_ml numeric null`
- `tasting_notes text null`
- `grape_varieties jsonb not null default '[]'`
- `tags jsonb not null default '[]'`
- `critic_scores jsonb not null default '[]'`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 5.2 `glass_dimensions`
- `id uuid pk`
- `name text not null`
- `capacity_ml numeric not null check (capacity_ml > 0)`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- unique `name`

## 5.3 `bottle_sizes`
- `id uuid pk`
- `name text not null`
- `ml numeric not null check (ml > 0)`
- `is_active boolean not null default true`

Constraints:
- unique `ml`

## 5.4 `product_serving_rules`
- `id uuid pk`
- `product_id uuid null` references `products(id)`
- `category_id uuid null` references `categories(id)`
- `sold_by_glass boolean not null default false`
- `glass_dimension_id uuid null` references `glass_dimensions(id)`
- `bottle_size_ml numeric null`
- `priority int not null default 100`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint:
- check `(product_id is not null or category_id is not null)`

## 5.5 `product_traits`
Flexible flags.

- `id uuid pk`
- `product_id uuid not null` references `products(id)`
- `trait_key text not null`
- `trait_value jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint:
- unique `(product_id, trait_key)`

---

# 6) Media + AI

## 6.1 `media_assets`
- `id uuid pk`
- `bucket text not null`
- `path text not null`
- `public_url text null` (optional)
- `mime_type text null`
- `size_bytes bigint null`
- `width int null`
- `height int null`
- `hash text null`
- `created_by uuid null` references `profiles(id)`
- `created_at timestamptz not null default now()`

Constraint:
- unique `(bucket, path)`

## 6.2 `product_assets`
- `id uuid pk`
- `product_id uuid not null` references `products(id)`
- `asset_id uuid not null` references `media_assets(id)`
- `role text not null` (product_primary|product_label|inventory_evidence|other)
- `is_primary boolean not null default false`
- `created_at timestamptz not null default now()`

Constraint:
- unique `(product_id, asset_id, role)`

## 6.3 `ai_runs`
- `id uuid pk`
- `run_type text not null` (label_recognition|ocr|embedding_match)
- `status text not null` (queued|running|succeeded|failed|cancelled)
- `model_name text null`
- `model_version text null`
- `input_asset_id uuid null` references `media_assets(id)`
- `confidence numeric null`
- `result jsonb not null default '{}'`
- `duration_ms int null`
- `created_by uuid null` references `profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 6.4 `ai_match_candidates`
- `id uuid pk`
- `ai_run_id uuid not null` references `ai_runs(id)`
- `product_id uuid not null` references `products(id)`
- `score numeric not null`
- `rank int not null`
- `created_at timestamptz not null default now()`

Constraint:
- unique `(ai_run_id, product_id)`

## 6.5 `ai_feedback`
- `id uuid pk`
- `ai_run_id uuid not null` references `ai_runs(id)`
- `chosen_product_id uuid null` references `products(id)`
- `chosen_by uuid not null` references `profiles(id)`
- `feedback_type text not null` (correct|incorrect|partial|no_match)
- `notes text null`
- `created_at timestamptz not null default now()`

## 6.6 `product_search_index` (pgvector)
This table is required for the hybrid OCR + embeddings retrieval pipeline described in `doc/new/AI/ocr_scheme.md`.

- `product_id uuid pk` references `products(id)` on delete cascade
- `search_text text not null`
- `content text not null` (raw text used to generate embedding: name + producer + region)
- `embedding vector(1536) not null`
- `model_name text not null default 'text-embedding-3-small'`
- `updated_at timestamptz not null default now()`

Indexes:
- vector index on `embedding` (IVFFlat or HNSW)

## 6.7 `ai_config`
AI configuration (singleton, one row only).

- `id uuid pk` (fixed value, e.g., '00000000-0000-0000-0000-000000000001')
- `is_active boolean not null default true`
- `ocr_provider text not null default 'google_vision'`
- `vision_provider text not null default 'gemini'`
- `embedding_provider text not null default 'openai'`
- `use_system_key boolean not null default true`
- `custom_api_key_encrypted text null`
- `model_config jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

---

# 7) Inventory (baseline + events + aggregates)

## 7.1 `inventory_sessions`
- `id uuid pk`
- `store_id uuid not null` references `stores(id)`
- `status text not null` (draft|in_progress|pending_review|approved|synced|cancelled|flagged)
- `title text null`
- `comment text null`
- `baseline_source text not null default 'syrve_stock_snapshot'`
- `baseline_taken_at timestamptz null`
- `manager_only_expected boolean not null default true`
- `created_by uuid not null` references `profiles(id)`
- `approved_by uuid null` references `profiles(id)`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `approved_at timestamptz null`
- `syrve_document_id text null`
- `syrve_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 7.2 `inventory_baseline_items`
Immutable manager-only baseline snapshot.

- `id uuid pk`
- `session_id uuid not null` references `inventory_sessions(id)`
- `product_id uuid not null` references `products(id)`
- `expected_qty_unopened numeric not null default 0`
- `expected_open_liters numeric not null default 0`
- `expected_total_liters numeric null`
- `captured_at timestamptz not null default now()`

Constraint:
- unique `(session_id, product_id)`

## 7.3 `inventory_count_events`
Append-only.

- `id uuid pk`
- `session_id uuid not null` references `inventory_sessions(id)`
- `product_id uuid not null` references `products(id)`
- `counted_by uuid not null` references `profiles(id)`
- `bottles_unopened numeric not null default 0`
- `open_ml numeric not null default 0`
- `open_liters numeric generated always as (open_ml / 1000.0) stored`
- `method text not null` (manual|barcode|image_ai|manager_adjustment)
- `confidence numeric null`
- `ai_run_id uuid null` references `ai_runs(id)`
- `asset_id uuid null` references `media_assets(id)`
- `created_at timestamptz not null default now()`

## 7.4 `inventory_product_aggregates`
Fast totals.

- `session_id uuid not null`
- `product_id uuid not null`
- `counted_unopened_total numeric not null default 0`
- `counted_open_liters_total numeric not null default 0`
- `counted_total_liters numeric not null default 0`
- `updated_at timestamptz not null default now()`

Primary key:
- `(session_id, product_id)`

## 7.5 `inventory_variances` (optional materialization)
- `session_id uuid not null`
- `product_id uuid not null`
- `expected_total_liters numeric not null default 0`
- `counted_total_liters numeric not null default 0`
- `difference_liters numeric not null default 0`
- `has_variance boolean not null default false`
- `computed_at timestamptz not null default now()`

Primary key:
- `(session_id, product_id)`

## 7.6 `stock_snapshots`
Optional historical store+product snapshots.

- `id uuid pk`
- `store_id uuid not null` references `stores(id)`
- `product_id uuid not null` references `products(id)`
- `snapshot_at timestamptz not null default now()`
- `qty numeric not null default 0`
- `source text not null default 'syrve_stock_and_sales'`
- `created_at timestamptz not null default now()`

---

# 8) ERD (high-level)
- `business_profile` 1—N `profiles`
- `profiles` N—N `roles` via `user_roles`
- `syrve_config` (singleton)
- `org_nodes`, `stores`, `categories`, `products`
- `products` 1—N `product_barcodes`, `product_assets`
- `inventory_sessions` 1—N `inventory_baseline_items`
- `inventory_sessions` 1—N `inventory_count_events`  -> aggregates/variances
- `inventory_sessions` 1—N `syrve_outbox_jobs`

