Below is a **Lead DB Architect** solution for a Syrve-driven Wine Inventory system (Server API only) that:

* Stores **all Syrve data safely and losslessly** (raw mirror + normalized “operational” tables)
* Adds your **own business layer**: users/roles, inventory sessions, collaborative counts (no overwrites), wine enrichment, images, AI recognition, audit, logs
* Keeps Syrve as **source of truth for catalog**, while your app owns **inventory workflow + enrichment + history**
* Works cleanly in **Supabase/Postgres** with **multi-tenancy + RLS** (as your docs already require).

---

## 0) Core architecture principle: Dual-write model (Mirror + Canonical)

### Layer A — **Syrve Mirror (lossless, append-friendly)**

Purpose: keep **exact Syrve payloads**, track deltas, support re-parsing when Syrve changes schema, and be able to re-build the canonical model anytime.

This is your “truth snapshot” of Syrve.

### Layer B — **Canonical App Model (normalized, query-optimized)**

Purpose: fast UI, clean constraints, reporting, RLS, and inventory business rules.

This matches your existing approach: categories/products + inventory_sessions/items + logs.

---

## 1) Multi-tenancy foundation (non-negotiable)

Use the **business_profile** as tenant root and attach `business_id` everywhere (except auth tables). This is already defined in your schema docs.

### Key tables

* `business_profile` (tenant)
* `profiles` (users linked to auth.users)
* `user_roles` (role assignment)
* `audit_logs`, `error_logs` (global observability per tenant)

Your role model and RLS approach already exists; keep it.

---

## 2) Syrve Integration tables (Mirror + Sync control)

You already have `syrve_config` and `syrve_sync_logs`. Extend them slightly and add a “raw object store”.

### 2.1 `syrve_config` (singleton per business)

Keep fields you already spec’d: server_url, login, encrypted password, store_id, status, last_sync_at.

Add:

* `syrve_instance_fingerprint` (text) — helps detect “same tenant pointed to different Syrve server”
* `sync_lock_until` (timestamptz) — prevents parallel sync (license constraints)
* `default_department_id` (uuid, optional)

### 2.2 `syrve_raw_objects` (the mirror backbone)

**Goal:** store every Syrve entity payload (departments/groups/stores/products/etc.) as-is.

Columns:

* `id` uuid pk
* `business_id` uuid
* `entity_type` text (e.g., `department`, `group`, `store`, `product`)
* `syrve_id` uuid (external)
* `payload` jsonb (or xml text if you keep raw XML; jsonb preferred post-parse)
* `payload_hash` text (dedupe)
* `revision` bigint nullable (if Syrve has it; otherwise omit)
* `synced_at` timestamptz
* `is_deleted` boolean (derived)
* **unique** (`business_id`, `entity_type`, `syrve_id`, `payload_hash`) to avoid storing identical copies

Why:

* You can re-derive canonical tables anytime.
* You can debug mismatches instantly.

### 2.3 `syrve_sync_runs` (stronger than logs)

You already have a sync log concept. Keep it, but I strongly recommend splitting into:

* `syrve_sync_runs` (run-level) + `syrve_sync_errors` (item-level)

This matches “trust but verify” validation patterns from your docs.

---

## 3) Canonical reference model (Organization + Catalog)

### 3.1 Organization model (from Syrve departments/groups/stores)

Even if inventory needs mainly stores, you should store the whole hierarchy for future-proofing.

Tables:

1. `org_nodes`

* `id` uuid pk
* `business_id`
* `syrve_id` uuid unique per business
* `node_type` enum (`corporation`, `jur_person`, `department`, `store`, `sale_point`, `terminal_group`, etc.)
* `parent_id` fk self
* `name`, `code`
* `is_active`, `synced_at`
* `syrve_data` jsonb

2. `stores`

* `id` uuid pk
* `business_id`
* `syrve_store_id` uuid unique per business
* `name`, `code`
* `org_node_id` fk -> org_nodes
* `is_active`, `synced_at`

> This aligns with your existing “locations from Syrve stores or manual” direction.

### 3.2 Catalog model (Categories + Products)

You already have a strong base: `categories`, `products`, `product_barcodes`.

Keep it, but architect it as:

#### `categories`

* `id` uuid pk
* `business_id`
* `syrve_group_id` uuid unique per business
* `name`
* `parent_id` self (internal)
* `syrve_parent_group_id` uuid
* `default_glass_id` fk -> glass_dimensions (you already planned this) 
* `is_active`, `synced_at`
* `syrve_data` jsonb

#### `products` (canonical item)

* `id` uuid pk
* `business_id`
* `syrve_product_id` uuid unique per business
* `category_id` fk
* `sku` (Syrve num), `code`
* `name`, `description`
* `product_type` (GOODS/DISH/etc.) 
* `unit_name`
* `unit_capacity` numeric (liters or base units)
* `is_active`, `synced_at`
* `syrve_data` jsonb (store full Syrve payload, as you already require)

#### `product_barcodes`

* unique `(business_id, barcode)` (your doc already mandates this)

---

## 4) Your “Wine intelligence” layer (Enrichment without breaking generic catalog)

You had two alternative directions in docs:

* Joined inheritance: `products` + `wines` extension 
* Or “products-only” with `metadata` jsonb

**Best DB architecture for your scope:** keep **generic products** + **wine extension tables** for high-value wine features, BUT do not require that every product is wine.

### 4.1 Wine classifier / overlay

#### `product_traits`

* `product_id` fk
* `trait_key` (e.g., `is_wine`, `served_by_glass`, `needs_ml_tracking`)
* `trait_value` jsonb
* unique `(product_id, trait_key)`

This makes “by glass” rules work even if the item is “Champagne” or “Vermouth”.

### 4.2 `wine_profiles` (optional 1:1 extension)

Only created when product is wine-like.

* `product_id` pk/fk -> products.id (unique)
* `vintage`, `producer`, `region`, `grapes`, `abv`, tasting notes, etc.
* plus your “complete wine” model can live here (you already have a very extensive one in your full schema doc) 

**Why:** fast filtering/reporting on core wine dimensions without scanning JSON.

### 4.3 Bottle sizes + glass sizes (configurable rules)

You already include `glass_dimensions` and volume options in earlier migration plan; keep them but tie them to products and categories.

Tables:

* `glass_dimensions` (business_id, capacity_ml, name, active)
* `bottle_sizes` (business_id, ml, label, active)
* `product_pour_rules`

  * `product_id` nullable
  * `category_id` nullable
  * `glass_dimension_id`
  * `bottle_size_ml` nullable (override)
  * precedence: product rule > category rule > default business rule

---

## 5) Inventory: event-sourced + manager aggregation (solves concurrency cleanly)

Your requirement: multiple users count same time, no fixed location, **no overwrites**, manager sees expected stock only.

Your existing docs lean toward “inventory_items per user”.
I’ll make it architecturally bulletproof:

### 5.1 `inventory_sessions`

Keep your status flow (draft → in_progress → pending_review → approved/synced/cancelled).

Add:

* `store_id` fk -> stores
* `baseline_source` enum (`syrve_snapshot`, `manual`)
* `baseline_taken_at`
* `manager_only_expected` boolean default true
* `syrve_document_id` nullable

### 5.2 Baseline expected stock (immutable snapshot per session)

#### `inventory_baseline_items`

* `session_id`
* `product_id`
* `expected_qty` numeric
* `expected_value` numeric optional
* unique `(session_id, product_id)`

This is what Manager sees; staff does not.

### 5.3 Counting model (append-only events, not “latest row wins”)

#### `inventory_count_events`

* `id` uuid pk
* `business_id`
* `session_id`
* `product_id`
* `counted_by` (profile id)
* `bottle_qty` numeric (unopened)
* `open_ml` numeric
* `open_liters` generated (`open_ml / 1000`)
* `method` enum (`manual`, `barcode`, `ai_image`)
* `ai_run_id` nullable (links to AI pipeline)
* `image_asset_id` nullable (links to captured image)
* `created_at`

**Why this is best:** concurrency becomes trivial. Everyone writes events. Aggregation is deterministic.

### 5.4 Manager aggregation (materialized table or view)

#### `inventory_product_aggregates`

* `session_id`
* `product_id`
* `counted_bottle_qty_total`
* `counted_open_liters_total`
* `counted_total_equiv_bottles` (optional derived)
* `updated_at`
* unique `(session_id, product_id)`

Update it by:

* trigger on insert into `inventory_count_events`
* or scheduled recompute job (safer for large volumes)

### 5.5 Inventory history per product

You want deep history (counts, changes, sessions). That’s naturally derived from:

* `inventory_sessions`
* `inventory_baseline_items`
* `inventory_count_events`
* `inventory_product_aggregates`

No need a separate “history” table unless you want precomputed “last_counted_at”.

---

## 6) Syrve document outbox (reliable “Send to Syrve”)

Your docs already have sync logs and syrve_document_id on sessions.

Add an outbox so “Send” is idempotent and retryable.

### `syrve_outbox_jobs`

* `id`
* `business_id`
* `session_id`
* `job_type` enum (`inventory_import`)
* `payload_xml` text
* `payload_hash` text (idempotency)
* `status` enum (`pending`, `processing`, `success`, `failed`)
* `attempts`, `last_error`, `last_attempt_at`
* `syrve_response` jsonb/text
* unique `(business_id, job_type, payload_hash)` — prevents duplicate sends

This is **mission-critical** in restaurants where Wi-Fi drops.

---

## 7) Images & Files (label scans, product images, inventory evidence)

You already have a full “wine_images” / media design in your database docs.
I recommend a more generic asset system:

### 7.1 `media_assets`

* `id` uuid
* `business_id`
* `storage_provider` (supabase)
* `bucket`, `path`, `public_url`
* `mime_type`, `size_bytes`, `width`, `height`
* `hash` (dedupe)
* `created_by`, `created_at`

### 7.2 Link tables (many-to-many, flexible)

* `product_assets` (product_id, asset_id, role: label/bottle/shelf, is_primary)
* `inventory_event_assets` (count_event_id, asset_id)
* `wine_profile_assets` (if you keep wine_profiles separate)

This avoids “images table explosion” while still supporting your detailed wine imagery requirements. 

---

## 8) AI pipeline tables (recognition, OCR, model tracking)

You want: AI recognition of bottle label, confidence, and storing the evidence.

### 8.1 `ai_runs`

* `id`
* `business_id`
* `run_type` enum (`label_recognition`, `ocr`, `embedding_match`)
* `model_name`, `model_version`
* `input_asset_id`
* `status` enum
* `confidence` numeric
* `result` jsonb (predicted product_id candidates, extracted text, etc.)
* `created_at`, `duration_ms`

### 8.2 `ai_product_matches`

* `ai_run_id`
* `candidate_product_id`
* `score`
* `rank`
* unique `(ai_run_id, candidate_product_id)`

### 8.3 `ai_feedback`

* `ai_run_id`
* `chosen_product_id`
* `chosen_by` user
* `feedback_type` (correct/incorrect/partial)
* `notes`

This gives you a training loop later without redesign.

---

## 9) Security model: RLS + “manager can see expected stock”

Your schema already includes RLS concepts by business_id.

Add row-level rules:

* Staff can insert `inventory_count_events` for sessions they participate in.
* Staff cannot read baseline expected quantities:

  * Put baseline in `inventory_baseline_items` and restrict SELECT to role manager/admin.
* Staff can read product list + their own count events.

You already have `has_role()` patterns in earlier migrations; extend to `manager`.

---

## 10) Performance & partitions (so it won’t slow down in 12 months)

Your docs already recommend indexing FKs, JSONB GIN indexes, and partitioning inventory/audit when large.

**Do this from day 1:**

* Index all `(business_id, syrve_product_id)` lookups
* `GIN` index on `products.syrve_data` only if you query it (otherwise skip)
* Partition heavy tables by month:

  * `inventory_count_events`
  * `audit_logs`
  * `error_logs`

---

## 11) Final ERD (text version)

* `business_profile` 1—N `profiles`
* `business_profile` 1—1 `syrve_config`
* `business_profile` 1—N `categories` 1—N `products` 1—N `product_barcodes`
* `products` 0—1 `wine_profiles` (optional extension)
* `inventory_sessions` 1—N `inventory_baseline_items`
* `inventory_sessions` 1—N `inventory_count_events` (append-only)
* `inventory_sessions` 1—N `inventory_product_aggregates`
* `inventory_count_events` N—0..1 `ai_runs` + N—0..1 `media_assets`
* `inventory_sessions` 1—N `syrve_outbox_jobs` (inventory commits)
* `syrve_raw_objects` stores all external payloads per entity

---

## What I would change vs your current docs (direct, no sugar-coating)

1. **Stop using “inventory_items as mutable per product rows”** for collaborative counting — you will get overwrite bugs. Use **append-only count events** + aggregates. Your docs already hint at “per user entries”; event-sourcing is the cleanest version of that.

2. Keep `products` as the canonical catalog (category-agnostic) and layer `wine_profiles` only where needed. This fits both approaches in your docs and avoids huge sparse wine tables for non-wine goods.

3. Add **syrve_raw_objects**. Without it, you’ll regret it when Syrve fields change or when you need to debug mismatched IDs.

