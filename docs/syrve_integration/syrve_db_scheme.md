Below is a **full Supabase (Postgres) database blueprint** for the whole app, designed as a **production-grade, Syrve-driven inventory system** with:

* **Server API only** (Syrve is source of truth for catalog + structure)
* Your app owns: **enrichment (wine details, images), AI recognition, inventory sessions, collaborative counting, review/approval, outbox to Syrve, logs**
* **Multi-tenant SaaS** with RLS
* Scales cleanly (history, audit, partitions)

I’m grounding this in your existing DB docs: multi-tenancy + core tables, Syrve config, categories/products with `syrve_data`, inventory sessions/items, glass rules, audit/error logs, and “trust-but-verify” schema validation approach.

---

# 1) Database architecture: the 3-layer model

## Layer A — Tenant + Security (SaaS foundation)

* `business_profile`, `profiles`, `user_roles`, `has_role()` RPC
* RLS policy pattern: every business-scoped table includes `business_id`
  This is already specified in your migrations/docs.

## Layer B — Syrve Mirror + Canonical Catalog

**Goal:** be able to:

1. **store Syrve data “as-is”** for audit/debug/rebuild
2. **query fast** with canonical tables (`categories`, `products`, etc.)

Your docs already define canonical `categories` + `products` + `syrve_data jsonb`.

## Layer C — Operational App Layer

Everything your app does:

* Inventory sessions (collaborative counting, manager-only baseline)
* Wine enrichment (images, “sold by glass”, bottle/glass rules)
* AI runs + matches + feedback
* Outbox jobs to Syrve
* Audit, notifications

---

# 2) Core tenant & auth tables (minimal changes)

## 2.1 `business_profile` (tenant root)

Keep as in schema: name, address, currency, language, etc.

**Add (recommended)**

* `timezone` (text, default `Europe/Lisbon`)
* `settings` jsonb (future-proof)
* `is_active` boolean

## 2.2 `profiles`

You already define user profiles linked to `auth.users`, plus role model and triggers.

**Make roles explicit**

* Keep `user_roles` table + `has_role()` function (already defined).

---

# 3) Syrve integration layer (Server API only)

## 3.1 `syrve_config` (singleton per business)

Use your documented structure (server_url, api_login, encrypted password, store_id, etc.).

**Add fields you’ll need for a robust production integration**

* `connection_tested_at` (you already list this) 
* `sync_lock_until` timestamptz (prevent parallel sync; important with Server API license constraints; your integration guide recommends single queue). 
* `selected_category_ids` uuid[] (optional, if you allow “only import these categories”)
* `account_surplus_code`, `account_shortage_code` (configurable accounting defaults for documents—your server-doc examples use these codes).

**Constraints**

* unique `(business_id)` (singleton pattern)

---

## 3.2 Syrve raw mirror (the “never regret it later” table)

### `syrve_raw_objects`

Stores any Syrve payload you fetch, so you can re-parse/re-sync without calling Syrve again.

Columns:

* `id` uuid PK
* `business_id` FK
* `entity_type` text (`department`, `group`, `store`, `product`, `product_group`, `terminal`, etc.)
* `syrve_id` uuid
* `payload` jsonb
* `payload_hash` text
* `synced_at` timestamptz
* `is_deleted` boolean (derived)
* Unique: `(business_id, entity_type, syrve_id, payload_hash)`

### `syrve_sync_runs`

Run-level logs (better than a single flat log table).

* `id`, `business_id`
* `run_type` (`bootstrap`, `products`, `stock_snapshot`, `inventory_check`, `inventory_commit`)
* `started_at`, `finished_at`
* `status` (`success`, `failed`, `partial`)
* `stats` jsonb (counts updated/inserted)
* `error` text

You already have `integration_syrve_sync_log` concept; this is the scalable evolution.

---

# 4) Canonical organization & catalog (fast queries)

Your docs already define the canonical set: `categories`, `products`, `product_barcodes`, optionally `locations`, `glass_dimensions`.

## 4.1 Organization mirror (Syrve structure)

### `org_nodes`

Represents Syrve “departments” hierarchy.

* `id` uuid PK
* `business_id`
* `syrve_id` uuid unique per business
* `node_type` text
* `parent_id` uuid (self FK)
* `name`, `code`
* `is_active`, `synced_at`
* `syrve_data` jsonb

### `stores`

Dedicated store/warehouse table (even if also stored in org_nodes).

* `id` uuid PK
* `business_id`
* `syrve_store_id` uuid unique per business
* `name`, `code`
* `org_node_id` FK (optional)
* `is_active`, `synced_at`

### `terminals` (optional)

* `syrve_terminal_id`, name, department link

> You’ll use `stores` everywhere for inventory baseline & Syrve document storeId.

---

## 4.2 Categories

### `categories`

Keep as per spec:

* `syrve_group_id` unique per business
* hierarchy via `parent_id`
* `default_glass_id` FK → `glass_dimensions`

Add:

* `is_in_scope` boolean (if admin selects categories for inventory)
* `sort_order` integer

---

## 4.3 Products (canonical)

### `products`

Keep your spec:

* `business_id`, `category_id`
* `syrve_product_id`, `sku` (num), `code`
* `unit_capacity` (liters), `unit_name`, `syrve_data jsonb`, `metadata jsonb`
* `is_active`, `synced_at`

**Important improvement**

* Remove “stock_on_hand/stock_expected” from products as authoritative fields.

  * Those values are **time-variant** and **store-variant**.
  * They should live in `stock_snapshots` and inventory baseline tables.
    Your detailed schema currently puts stock fields on products, but it will cause incorrect results with multiple stores and historical views.

---

## 4.4 Barcodes & Search

### `product_barcodes`

Already planned with uniqueness per business.

Add:

* `source` enum (`syrve`, `manual`, `ai`)
* `confidence` numeric (if AI inferred)

---

# 5) Your app layer: Wine enrichment, rules, and metadata

You have two approaches in docs:

* joined inheritance: `products` + `wines` extension
* or products metadata jsonb (more flexible)

**Best-of-both:** use joined inheritance for core wine analytics + JSONB for flexible enrichment.

## 5.1 `wines` (extension table, 1:1 with products)

As in your validation doc: `wines.product_id` unique FK → products.id.

Columns (core, queryable):

* `product_id` (PK/FK)
* `wine_type` enum
* `producer`, `vintage`, `country`, `region`, `appellation`
* `alcohol_content`, `volume_ml`
* `tasting_notes`
* `grape_varieties` jsonb / text[]
* `tags` jsonb
* `critic_scores` jsonb
* `is_active`

Keep deeper enrichment in `products.metadata` or an additional `wine_metadata` jsonb if needed (your “Complete DB” doc suggests rich indexing and constraints).

---

## 5.2 Serving rules (glasses, bottle sizes, sold-by-glass)

### `glass_dimensions`

Already specified.

### `bottle_sizes`

* `id`, `business_id`, `name` (“Standard 750”), `ml`, `is_active`

### `product_serving_rules`

Purpose: configure “sold by glass”, glass size mapping, bottle size overrides.

Columns:

* `id`
* `business_id`
* `product_id` nullable
* `category_id` nullable
* `sold_by_glass` boolean
* `glass_dimension_id` nullable
* `bottle_size_ml` nullable
* `priority` int (product rules > category rules > default)
* Check constraint: at least one of (product_id, category_id) not null

---

# 6) Inventory system (collaborative counting done right)

Your older tables show `inventory_items` storing “counted_quantity” directly, but your new requirement is multi-user, no overwrites. The correct DB design is **event-sourced counts + aggregates**.

You already have `inventory_sessions` in schema and business rules.

## 6.1 `inventory_sessions`

Keep your detailed fields from “Complete DB” (session_type, filters, totals, status lifecycle).

Add:

* `business_id`
* `store_id` FK -> stores (Syrve store)
* `status` enum (draft/in_progress/pending_review/approved/synced/cancelled/flagged) (you already use this enum) 
* `baseline_taken_at`
* `baseline_source` (`syrve_stock_snapshot`, `syrve_check_result`)
* `manager_only_expected` boolean default true
* `syrve_document_id` text nullable
* `syrve_synced_at` timestamptz nullable

## 6.2 Baseline expected stock (per session, immutable)

### `inventory_baseline_items`

* `session_id`
* `product_id`
* `expected_qty_unopened` numeric (if Syrve provides)
* `expected_open_liters` numeric (often 0; open bottles are your app concept)
* `expected_total_liters` numeric (optional)
* `captured_at`
* Unique `(session_id, product_id)`

This is what Manager sees; staff is blocked via RLS.

## 6.3 Collaborative counting: append-only events

### `inventory_count_events`

* `id`
* `business_id`
* `session_id`
* `product_id`
* `counted_by` FK -> profiles
* `bottles_unopened` numeric
* `open_ml` numeric
* `open_liters` generated/derived
* `method` enum (`manual`, `barcode`, `image_ai`) (you already defined)
* `confidence` numeric (AI)
* `ai_run_id` FK nullable
* `asset_id` FK nullable (photo evidence)
* `created_at`

**Why:** no overwrites, perfect audit, concurrency-safe.

## 6.4 Aggregation for manager UI (fast reads)

### `inventory_product_aggregates`

* `session_id`
* `product_id`
* `counted_unopened_total`
* `counted_open_liters_total`
* `counted_total_liters` (derived)
* `updated_at`
* Unique `(session_id, product_id)`

Update strategy:

* DB trigger on insert into `inventory_count_events`, or scheduled compute.
  (Trigger is fine until massive volume.)

## 6.5 Review & variance table (optional but convenient)

Variance can be computed in views, but storing it improves UX and reduces query complexity.

### `inventory_variances`

* `session_id`
* `product_id`
* `expected_total_liters`
* `counted_total_liters`
* `difference_liters`
* `has_variance` boolean
* `computed_at`

This mirrors your doc’s “variance generated columns” logic but moved into a session-level derived table, which fits event sourcing better.

---

# 7) Stock snapshots (store-variant, time-variant)

Don’t store stock on `products`. Use snapshots.

### `stock_snapshots`

* `id`
* `business_id`
* `store_id` FK
* `product_id` FK
* `snapshot_at` timestamptz
* `qty` numeric
* `source` enum (`syrve_stock_and_sales`, `syrve_balance_report`)
* Unique `(business_id, store_id, product_id, snapshot_at::date)` (or timestamp granularity)

Your “Complete DB” also supports snapshot unique constraints.

---

# 8) Syrve “Send to Syrve” reliability: Outbox + logs

Your server integration guide defines the check + import endpoints workflow.

### `syrve_outbox_jobs`

* `id`
* `business_id`
* `session_id` FK
* `job_type` enum (`inventory_check`, `inventory_commit`)
* `payload_xml` text
* `payload_hash` text (idempotency)
* `status` enum (`pending`, `processing`, `success`, `failed`)
* `attempts`, `last_error`, `last_attempt_at`
* `response_xml` text
* Unique `(business_id, job_type, payload_hash)`

### `syrve_api_logs`

You already have audit/error tables, but API logs deserve a dedicated table:

* `id`, `business_id`
* `action_type` (AUTH, FETCH_PRODUCTS, CHECK_INVENTORY, COMMIT_INVENTORY)
* `status`
* `request_payload` (text, may be truncated), `response_payload` (text)
* `error_message`
* `created_at`

This matches your integration docs and logging requirements.

---

# 9) AI + Images (recognition, evidence, continuous improvement)

Your app needs:

* product images (enrichment)
* inventory counting images (evidence)
* AI runs and match candidates
  This is not fully described in early schema, but your detailed DB mentions image handling and AI as features.

## 9.1 `media_assets`

Generic file registry for Supabase Storage:

* `id`, `business_id`
* `bucket`, `path`, `public_url`
* `mime_type`, `size_bytes`
* `width`, `height`
* `hash` (dedupe)
* `created_by`, `created_at`

## 9.2 Link tables

* `product_assets` (product_id, asset_id, role, is_primary)
* `inventory_event_assets` (count_event_id, asset_id)

## 9.3 AI execution & matching

### `ai_runs`

* `id`, `business_id`
* `run_type` (`label_recognition`, `ocr`, `embedding_match`)
* `model_name`, `model_version`
* `input_asset_id`
* `status`
* `confidence`
* `result` jsonb
* timestamps + duration

### `ai_match_candidates`

* `ai_run_id`, `product_id`, `score`, `rank`

### `ai_feedback`

* `ai_run_id`, `chosen_product_id`
* `chosen_by`, `feedback_type`, `notes`

This enables learning loop + future automation.

---

# 10) App configuration & feature flags

You already have:

* `app_settings`, `feature_flags`, `audit_logs`, `error_logs`, `system_notifications`

Extend configuration into business-scoped tables (so settings don’t collide across tenants):

## `business_settings`

* `business_id` unique
* `currency`, `language`, `timezone`
* `ai_recognition_enabled`
* `inventory_requires_approval`
* `default_glass_id`
* `default_bottle_size_ml`
* `settings` jsonb

Feature flags table already exists in your schema; keep it but add `business_id` as in detailed schema.

---

# 11) Relationships: how data is organized end-to-end

Here’s the real-life data flow and which tables are touched.

## 11.1 Admin connects Syrve

* writes: `syrve_config`
* sync creates:

  * `org_nodes`, `stores`, `categories`, `products`, `product_barcodes`
  * also `syrve_raw_objects`, `syrve_sync_runs`

## 11.2 Inventory session created (manager)

* insert `inventory_sessions`
* fetch Syrve stock → write `stock_snapshots` (optional) + `inventory_baseline_items`

## 11.3 Staff counts concurrently

* insert many `inventory_count_events`
* background trigger updates `inventory_product_aggregates`

## 11.4 Manager review & approve

* compute variances:

  * view or `inventory_variances`
* status update in `inventory_sessions`
* store manager adjustments as additional `inventory_count_events` (source=manager)

## 11.5 Send to Syrve

* create `syrve_outbox_jobs` with XML payload
* worker processes:

  * logs in Syrve, POST check/import
  * writes `syrve_api_logs` + updates outbox status + updates session (`syrve_document_id`, `synced_at`)

---

# 12) RLS (security) logic in DB terms

You already plan RLS across business_id.

Key policies you must implement:

1. **All business tables**

* `SELECT`: only rows where `business_id` matches user’s profile business
* `INSERT/UPDATE/DELETE`: same + role checks

2. **Manager-only “expected stock”**

* `inventory_baseline_items`: SELECT only if has_role('manager' or 'admin')
* Staff can still count and see their own totals via aggregates (without expected)

3. **Counting**

* Staff can INSERT into `inventory_count_events` only if:

  * session belongs to their business
  * session.status in (in_progress)
* Staff can UPDATE only their own events (optional), or no updates at all (pure append-only)

This matches your role-based approach with `has_role()` function already in migrations.

---

# 13) Performance plan (so it doesn’t die after 3 months)

You already specify indexing and partitioning options.

Do immediately:

* Index all FK columns (`business_id`, `session_id`, `product_id`, `store_id`)
* Unique indexes:

  * `products(business_id, syrve_product_id)`
  * `product_barcodes(business_id, barcode)`
* Add partial indexes for active products/categories

Do in “phase 2 scaling”:

* Partition `inventory_count_events` by month (biggest growth)
* Partition `syrve_api_logs` and `audit_logs` if needed

---

# 14) The final “full DB list” (tables inventory)

**Tenant/Security**

* business_profile
* profiles
* user_roles
* business_settings
* feature_flags
* audit_logs
* error_logs
* system_notifications
* app_settings (global keys if you keep it; prefer business_settings for tenant config)

**Syrve Integration**

* syrve_config
* syrve_raw_objects
* syrve_sync_runs
* syrve_api_logs
* syrve_outbox_jobs
* (optional) syrve_store_mapping (if you support internal locations vs Syrve stores; your older integration docs had this)

**Organization/Catalog**

* org_nodes
* stores
* terminals (optional)
* categories
* products
* product_barcodes

**Wine enrichment**

* wines (1:1 with products)
* glass_dimensions
* bottle_sizes
* product_serving_rules

**Inventory**

* inventory_sessions
* inventory_baseline_items
* inventory_count_events
* inventory_product_aggregates
* inventory_variances (optional)
* stock_snapshots

**Media + AI**

* media_assets
* product_assets
* inventory_event_assets
* ai_runs
* ai_match_candidates
* ai_feedback

---


