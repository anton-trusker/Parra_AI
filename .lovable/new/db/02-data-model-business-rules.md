# 02 — Data Model & Business Rules

## Design Principle: Syrve-Driven, Category-Agnostic

The data model supports **any product type** — wine, spirits, beer, food, cleaning supplies, etc. Product structure, categories, and units all come from Syrve. The app stores a local copy in Supabase for fast access and offline capability.

---

## Entity Overview

```
syrve_config (1 row per connection)

categories ──── products (1:N via category_id)  
                   ├── product_barcodes (1:N)
                   ├── product_images (1:N)
                   ├── product_units (1:N, from Syrve)
                   ├── inventory_items (1:N via product_id)
                   └── syrve_product_mappings (1:1)

inventory_sessions ── inventory_items (1:N)
                   └── profiles (N:1 via created_by)

profiles ── app_roles_config (N:1 via role)
         └── audit_logs (1:N)

locations (synced from Syrve stores or manually configured)
```

---

## Core Entities

### Syrve Configuration (`syrve_config` table)

**This is the foundation — admin configures this first, everything else follows.**

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | Auto-generated PK |
| `server_url` | text | **Required**. Syrve server base URL (e.g., `http://192.168.1.100:8080`). No trailing `/resto/api` — appended by Edge Functions. |
| `api_login` | text | **Required**. Syrve API username |
| `api_password_encrypted` | text | **Required**. Encrypted password (NOT plaintext). Encrypted using Supabase Vault or symmetric key. Only Edge Functions can decrypt. |
| `store_id` | UUID | **Required after first sync**. Selected Syrve store GUID |
| `store_name` | text | Display name of selected store |
| `organization_id` | UUID | Syrve organization GUID (auto-fetched on connection test) |
| `server_version` | text | Syrve server version (auto-fetched on connection test) |
| `auto_sync_enabled` | boolean | Whether periodic product sync is active. Default: `false` |
| `auto_sync_interval_minutes` | integer | Sync frequency. Default: `1440` (daily) |
| `connection_status` | text | `connected`, `disconnected`, `error` |
| `connection_tested_at` | timestamp | Last successful connection test |
| `last_product_sync_at` | timestamp | Last product sync completion time |
| `last_sync_products_count` | integer | Products synced in last sync |
| `last_sync_categories_count` | integer | Categories synced in last sync |
| `created_at` | timestamp | When config was first saved |
| `updated_at` | timestamp | Last config change |
| `created_by` | UUID | FK → profiles.id (admin who set it up) |

**Rules:**
- Only ONE active config row per installation (singleton pattern)
- Password NEVER sent to frontend — only Edge Functions access it
- `store_id` can only be selected after successful connection test (which returns available stores)
- RLS: only `admin` role can read/write this table

#### Connection Test Flow

```
Admin enters URL + login + password → clicks "Test Connection"
  ↓
Edge Function: syrve-connect-test
  1. Append /resto/api to server_url
  2. SHA1 hash the password
  3. GET /auth?login={login}&pass={hash}
  4. If success → token received
     a. GET /corporation/stores?key={token} → list stores
     b. GET version info (optional)
     c. GET /logout?key={token}
     d. Return: { success: true, stores: [...], serverVersion: "7.8.2" }
  5. If failure → return: { success: false, error: "Invalid credentials" }
  ↓
Frontend shows result:
  - ✅ Connected! Shows store dropdown for selection
  - ❌ Failed: shows error message
```

---

### Categories (`categories` table)

Synced from Syrve product groups. Represents the product hierarchy.

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | Auto-generated PK (app-side) |
| `syrve_group_id` | UUID | **Unique**. Syrve product group GUID |
| `name` | text | Group name from Syrve (e.g., "Wines", "Spirits", "Beer", "Food") |
| `parent_id` | UUID | FK → categories.id. Syrve groups are hierarchical. |
| `syrve_parent_group_id` | UUID | Syrve parent group GUID (for sync matching) |
| `description` | text | Optional description |
| `sort_order` | integer | Display order |
| `is_active` | boolean | Whether to show in filters. Default: `true` |
| `icon` | text | Optional emoji or icon name for UI display |
| `synced_at` | timestamp | Last sync from Syrve |

**Example hierarchy after sync:**
```
All Products
├── Wines
│   ├── Red Wines
│   ├── White Wines
│   ├── Sparkling
│   └── Rosé
├── Spirits
│   ├── Whisky
│   ├── Vodka
│   └── Gin
├── Beer
│   ├── Draft
│   └── Bottled
├── Soft Drinks
└── Food
    ├── Appetizers
    └── Main Courses
```

---

### Products (`products` table — replaces `wines`)

The central entity. Each record represents a unique product from Syrve.

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | Auto-generated PK |
| `syrve_product_id` | UUID | **Unique**. Syrve product GUID. Never null after sync. |
| `name` | text | **Required**. Product name from Syrve |
| `category_id` | UUID | FK → categories.id |
| `syrve_group_id` | UUID | Syrve product group GUID |
| `sku` | text | Syrve `num` field (article number) |
| `product_type` | text | From Syrve: `GOODS`, `DISH`, `SERVICE`, `MODIFIER`, `OUTER`, `PREPARED` |
| `unit_name` | text | Primary unit name (e.g., "бут", "шт", "кг", "л") |
| `unit_capacity` | decimal | Unit capacity in base units (e.g., 0.75 for 750ml bottle) |
| `unit_measure` | text | Base measurement unit (e.g., "л", "кг", "шт") |
| `barcode_primary` | text | Primary barcode from Syrve |
| `purchase_price` | decimal | Cost price from Syrve |
| `retail_price` | decimal | Selling price from Syrve |
| `stock_on_hand` | decimal | Current stock (updated by inventory counts) |
| `stock_expected` | decimal | Expected stock (from last Syrve sync or last count) |
| `par_level` | decimal | Minimum stock threshold. NULL = no alert. |
| `image_url` | text | Product image URL (Supabase Storage) |
| `syrve_data` | jsonb | **Full Syrve product JSON** — stores ALL original fields for reference |
| `is_active` | boolean | Whether product is active. Default: `true` |
| `is_countable` | boolean | Whether this product appears in inventory counts. Default: `true` |
| `created_at` | timestamp | First sync time |
| `updated_at` | timestamp | Last update time |
| `synced_at` | timestamp | Last Syrve sync time |

**Key Differences from Wine-Specific Model:**
- No fixed wine fields (grape, vintage, region, ABV, etc.)
- `syrve_data` JSONB column stores ALL original Syrve fields — anything category-specific lives here
- Units and capacities are dynamic from Syrve (not hardcoded ml)
- `product_type` from Syrve determines behavior (only `GOODS` and `DISH` are typically countable)

#### Stock Level Rules

```
Stock Status Calculation:
  IF par_level IS NULL               → "No Par Set" (gray)
  IF stock_on_hand = 0               → "Out of Stock" (red badge)
  IF stock_on_hand < par_level       → "Low Stock" (yellow badge)
  ELSE                               → "In Stock" (green badge)
```

---

### Product Barcodes (`product_barcodes` table)

Multiple barcodes per product (from Syrve).

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | Auto-generated PK |
| `product_id` | UUID | FK → products.id |
| `barcode` | text | **Unique** across all products |
| `barcode_type` | text | `ean13`, `upca`, `ean8`, `custom` |
| `is_primary` | boolean | Only one per product |
| `synced_from_syrve` | boolean | Whether this came from Syrve sync |
| `created_at` | timestamp | When registered |

**Lookup on scan:**
```
1. SELECT product_id FROM product_barcodes WHERE barcode = :scanned
2. If found → load product → QuantityPopup
3. If not found → manual search
```

---

### Inventory Session (`inventory_sessions` table)

Unchanged conceptually — works with products instead of wines.

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | Auto-generated PK |
| `session_number` | text | Auto-generated: `INV-{YYYY}-{NNN}` |
| `session_type` | enum | `full`, `partial`, `spot_check` |
| `status` | enum | `draft` → `in_progress` → `pending_review` → `completed` / `cancelled` |
| `created_by` | UUID | FK → profiles.id |
| `started_at` | timestamp | When counting began |
| `completed_at` | timestamp | When finished |
| `notes` | text | Session-level notes |
| `category_filter` | UUID | FK → categories.id. NULL = all categories. |
| `location_filter` | text | NULL = all locations |
| `total_products_counted` | integer | Computed: COUNT(DISTINCT product_id) |
| `total_units` | decimal | Computed: SUM of counted quantities |
| `total_variance` | decimal | Computed: SUM of absolute variances |
| `syrve_document_id` | text | Syrve doc number (after sync) |
| `syrve_sync_status` | text | `pending`, `synced`, `failed`, `not_required` |

#### Session Lifecycle

```
    ┌──────┐        ┌────────────┐       ┌───────────────┐
    │ draft│───────▶│in_progress │──────▶│pending_review │
    └──────┘        └────────────┘       └───────┬───────┘
                         │                       │
                   [cancel]                [approve] [flag]
                         ▼                       ▼
                   ┌───────────┐           ┌───────────┐
                   │ cancelled │           │ completed │
                   └───────────┘           └───────────┘
```

---

### Inventory Item (`inventory_items` table)

Individual count records — one per product per location per user.

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | Auto-generated PK |
| `session_id` | UUID | FK → inventory_sessions.id |
| `product_id` | UUID | FK → products.id |
| `counted_by` | UUID | FK → profiles.id |
| `counted_quantity` | decimal | Quantity counted by this user at this location |
| `expected_quantity` | decimal | Expected quantity from products.stock_on_hand |
| `variance` | decimal | `counted_quantity - expected_quantity` |
| `counting_method` | enum | `manual`, `barcode`, `ai_image` |
| `ai_confidence` | decimal | 0.0–1.0 (only for ai_image method) |
| `location` | text | Where counted |
| `notes` | text | Per-item notes |
| `image_url` | text | Captured image URL |
| `created_at` | timestamp | When counted |

**Collaborative counting aggregation** (on session completion):
```sql
-- Aggregate items for a product across all users and locations
SELECT 
  product_id,
  SUM(counted_quantity) AS total_counted
FROM inventory_items
WHERE session_id = :session_id
GROUP BY product_id;

-- Then update products
UPDATE products SET
  stock_on_hand = total_counted,
  updated_at = NOW()
WHERE id = :product_id;
```

---

### Inventory Movement (`inventory_movements` table)

Audit trail for all stock changes.

| Field | Type | Logic / Rules |
|-------|------|---------------|
| `id` | UUID | PK |
| `product_id` | UUID | FK → products.id |
| `user_id` | UUID | FK → profiles.id |
| `session_id` | UUID | FK → inventory_sessions.id (nullable) |
| `movement_type` | enum | `count`, `adjustment`, `receiving`, `sale`, `waste`, `sync` |
| `quantity_change` | decimal | Positive = added, Negative = removed |
| `quantity_before` | decimal | Stock before |
| `quantity_after` | decimal | Stock after |
| `reason` | text | Explanation |
| `method` | enum | `manual`, `barcode`, `ai_image`, `syrve_sync` |
| `created_at` | timestamp | When occurred |

---

### Profile (`profiles` table) — Unchanged

| Field | Type |
|-------|------|
| `id` | UUID (= auth.users.id) |
| `email` | text |
| `full_name` | text |
| `role` | enum: `admin`, `staff` |
| `avatar_url` | text |
| `is_active` | boolean |
| `created_at` | timestamp |
| `last_login` | timestamp |

---

### Syrve Sync Logs (`syrve_sync_logs` table)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `operation` | text | `connection_test`, `product_sync`, `inventory_commit`, `store_fetch` |
| `status` | text | `started`, `success`, `failed` |
| `details` | jsonb | Results: counts, errors, timing |
| `error_message` | text | Error if failed |
| `session_id` | UUID | FK (for inventory commits) |
| `products_created` | integer | Products created in this sync |
| `products_updated` | integer | Products updated in this sync |
| `categories_synced` | integer | Categories synced |
| `duration_ms` | integer | Operation duration |
| `created_at` | timestamp | Start time |

---

## Computed Views

```sql
-- Stock summary (category-aware)
CREATE VIEW stock_summary AS
SELECT 
  p.id, p.name, p.sku,
  c.name AS category_name,
  p.stock_on_hand, p.par_level,
  p.unit_name,
  CASE 
    WHEN p.stock_on_hand = 0 THEN 'out_of_stock'
    WHEN p.par_level IS NOT NULL AND p.stock_on_hand < p.par_level THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  p.stock_on_hand * p.purchase_price AS stock_value
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND p.is_countable = true;

-- Category breakdown
CREATE VIEW category_stock_summary AS
SELECT
  c.id, c.name,
  COUNT(p.id) AS product_count,
  SUM(p.stock_on_hand) AS total_stock,
  SUM(p.stock_on_hand * p.purchase_price) AS total_value,
  COUNT(CASE WHEN p.stock_on_hand = 0 THEN 1 END) AS out_of_stock_count,
  COUNT(CASE WHEN p.par_level IS NOT NULL AND p.stock_on_hand < p.par_level THEN 1 END) AS low_stock_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
GROUP BY c.id, c.name;
```

---

## Database Triggers

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `on_auth_user_created` | `auth.users` | INSERT | Create profile row with role `staff` |
| `on_session_completed` | `inventory_sessions` | UPDATE to `completed` | Aggregate items → update product stock |
| `on_item_created` | `inventory_items` | INSERT | Create movement audit record |
| `on_stock_changed` | `products` | UPDATE on stock fields | Check par levels → generate alerts |
| `on_syrve_config_updated` | `syrve_config` | UPDATE | Log config change in audit |
