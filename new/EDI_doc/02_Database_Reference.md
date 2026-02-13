## Global Conventions

*   **Primary Keys**: `UUID` (v4), mostly auto-generated (`gen_random_uuid()`).
*   **Timestamps**: `TIMESTAMPTZ` (timestamp with time zone), defaulting to `NOW()`.
*   **Money/Quantities**: `NUMERIC` (Decimal) for exact precision. Avoid `FLOAT`.

---

## Layer 1: Auth & Profiles

### `profiles`
Extends `auth.users`. Stores application-specific user data.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, FK auth.users | Links to Supabase Auth. |
| `full_name` | text | | Human readable name. |
| `avatar_url` | text | | |
| `role_id` | uuid | FK roles | RBAC reference. |
| `is_active` | boolean | DEFAULT true | |

### `app_settings`
Global platform-specific configuration (currency, locale, defaults).
Replaces `business_settings`.

---

## Layer 2: Syrve Integration

### `syrve_config`
Connection credentials and scope for the Syrve Server API.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `server_url` | text | NOT NULL | Base URL (`https://server:port`). |
| `api_login` | text | NOT NULL | Service user login. |
| `api_password_encrypted`| text | NOT NULL | Encrypted password (Vault). |
| `default_store_id` | uuid | | Default Syrve Store UUID for inventory. |
| `sync_lock_until` | timestamptz | | For concurrency control. |
| `last_sync_at` | timestamptz | | |
| `status` | text | | `connected`, `error`. |

### `syrve_raw_objects`
The "Raw Mirror". Stores the exact JSON received from Syrve.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `syrve_id` | uuid | | The UUID from Syrve. |
| `entity_type` | text | | `product`, `group`, `store`. |
| `payload` | jsonb | NOT NULL | Full JSON body. |
| `payload_hash` | text | | SHA256 for change detection. |
| `synced_at` | timestamptz | | |

### `syrve_outbox_jobs`
Queue for transactional writes back to Syrve.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `session_id` | uuid | FK inventory_sessions | Context. |
| `job_type` | text | | `inventory_commit`, `check`. |
| `payload_xml` | text | | The XML body to send. |
| `status` | text | DEFAULT 'pending' | `pending`, `processing`, `success`, `failed`. |
| `attempts` | int | DEFAULT 0 | Retry count. |
| `last_error` | text | | |

---

## Layer 3: Canonical Catalog

### `stores`
Locations/Warehouses mirrored from Syrve.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `syrve_store_id` | uuid | UNIQUE | |
| `name` | text | | |
| `is_active` | boolean | | |

### `categories`
Product Groups mirrored from Syrve.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `syrve_group_id` | uuid | UNIQUE | |
| `name` | text | | |
| `parent_id` | uuid | FK categories | Recursive hierarchy. |
| `is_active` | boolean | | |

### `products`
The central catalog entity.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `category_id` | uuid | FK categories | |
| `syrve_product_id` | uuid | UNIQUE | |
| `name` | text | | |
| `sku` | text | | Syrve `num`. |
| `product_type` | text | | `GOODS`, `DISH`, etc. |
| `base_unit_name` | text | | e.g., "liters", "pcs". |
| `unit_capacity` | numeric | | Factor (e.g., 0.75 for wines). |
| `details` | jsonb | | Additional data from Syrve (prices, codes). |
| `is_active` | boolean | | |

### `product_barcodes`
Scanning keys.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `product_id` | uuid | FK products | |
| `barcode` | text | | The scan value. |
| `is_primary` | boolean | | |

---

## Layer 4: Enrichment

### `wines`
Extension table (1:1) for `products`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `product_id` | uuid | PK, FK products | 1:1 Relationship. |
| `vintage` | text | | Year (e.g., "2018", "NV"). |
| `producer` | text | | |
| `region` | text | | |
| `sub_region` | text | | |
| `country` | text | | |
| `appellation` | text | | |
| `wine_type` | text | | Red, White, Rose, Sparkling, etc. |
| `grape_varieties`| jsonb | | Array of strings. |
| `alcohol_pct` | numeric | | |
| `tasting_notes` | text | | |
| `food_pairing` | jsonb | | Array of strings. |
| `serving_temp_c` | int | | |
| `details` | jsonb | | Extended profile: `body`, `sweetness`, `acidity`, `tannins`, `closure_type`. |
| `storage_location`| jsonb | | `cellar_section`, `rack_number`, `shelf_position`. |
| `inventory_settings`| jsonb | | `min_stock`, `max_stock`, `reorder_point`. |

---

## Layer 5: Inventory Operations

### `inventory_sessions`
Represents a "stocktaking" event.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `store_id` | uuid | FK stores | Where this is happening. |
| `status` | text | | `draft`, `in_progress`, `review`, `completed`, `synced`. |
| `started_at` | timestamptz | | |
| `completed_at` | timestamptz | | |
| `syrve_doc_id` | text | | ID of document in Syrve (after sync). |

### `inventory_baseline_items`
Snapshot of expected stock **at the start** of the session. FROZEN.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | uuid | PK, FK | |
| `product_id` | uuid | PK, FK | Composite PK. |
| `expected_qty` | numeric | | Quantity in Syrve at start. |
| `expected_volume`| numeric | | Total liters/kg expected. |

### `inventory_count_events`
Append-only log of every user action. The Source of Truth for counts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `session_id` | uuid | FK | |
| `product_id` | uuid | FK | |
| `user_id` | uuid | FK profiles | Who counted. |
| `bottles` | numeric | | Full units (usually integers, but maybe 0.5 for half?). |
| `open_volume` | numeric | | Partial volume (ml or weight). |
| `total_volume` | numeric | | Computed normalized volume. |
| `method` | text | | `scan`, `manual`, `ai`, `adjustment`. |
| `created_at` | timestamptz | | |

### `inventory_product_aggregates`
Materialized view (or cached table) for fast session status.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | uuid | PK, FK | |
| `product_id` | uuid | PK, FK | |
| `total_counted` | numeric | | Sum of events. |
| `total_variance` | numeric | | `usage` - `expected`. |

---

## Layer 6: Media & AI
Stores scan attempts, audit logs, and AI configuration settings for model providers.

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| `ai_config` | Model settings (provider, API keys) | `provider`, `model_name`, `api_key_encrypted`, `is_active` |
| `ai_recognition_attempts` | Audit trail of all label scans | `user_id`, `session_id`, `image_url`, `extracted_data`, `status` |
| `ai_match_candidates` | (Concept) Potential product matches | `attempt_id`, `product_id`, `confidence_score` |
| `media_assets` | Binary files metadata (images, PDFs) | `bucket_path`, `content_type`, `file_hash` |

---

### Layer 7: Syrve Integration Config
Connection parameters and synchronization logs for the external ERP.

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| `integration_syrve_config` | ERP endpoint and credentials | `base_url`, `api_login`, `api_password_hash`, `last_sync_at` |
| `integration_syrve_products`| Raw mirror of Syrve nomenclature | `syrve_product_id`, `raw_data`, `product_type`, `measure_unit` |
| `integration_syrve_sync_log`| Log of all sync attempts | `action_type`, `status`, `items_processed`, `error_message` |
| `syrve_credential_vault` | (Edge Only) Encrypted secrets | `secret_json`, `rotated_at` |
