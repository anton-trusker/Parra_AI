
---

## 1) First-time connection: what Admin sets up, step-by-step

### 1.1 Admin inputs (minimum)

**Required**

* `server_url` (base `/resto/api`)
* `login`
* `password` (store encrypted)
* **Scope selection**:

  * **Store (warehouse)** used for stock & inventory docs (choose from Syrve stores list)
  * **Department / SalePoint / Group** (optional, for filtering menus/prices or multi-branch setups)

Why: for inventory you’ll always need a **storeId** for stock queries and inventory document import.

### 1.2 Connection test (must)

* `GET /auth?login=...&pass=...` → token (then always `logout` after operations to release license if Syrve requires it; your integration doc already treats logout as mandatory).

### 1.3 “Bootstrap Sync” (first connection sync pack)

After successful auth, run the **bootstrap sync** in this order:

#### A) Corporation structure (used to scope and to label everything correctly)

1. **Departments** (hierarchy)

* `GET /corporation/departments` 
  Store:
* id, name, code, type (CORPORATION/JURPERSON/DEPARTMENT/STORE/etc.), parentId
* This becomes your “org tree” in the app.

2. **Stores (Warehouses)**

* `GET /corporation/stores` 
  Store:
* store id, name, code, type + metadata from `corporateItemDto`

3. **Groups (Branch groups / departments / POS groups)**

* `GET /corporation/groups`
  This response is richer than a plain list: it can include **points of sale** and **restaurant sections** like Bar/Kitchen/Terrace. 
  You can use this for:
* mapping “branch group → departments → sale points”
* optionally predefining inventory “zones” (Bar / Terrace etc.) **if client wants location tracking later**

4. **Terminals (optional)**

* `GET /corporation/terminals` 
  Not required for inventory, but useful for audit and future automation.

✅ Output of step A: Admin can now **select the storeId** (warehouse) that will be used for stock snapshots and inventory document imports.

---

#### B) Catalog / menu structure (your “Products” and “Categories”)

5. **Product Groups (Categories)**

* `GET /v2/entities/products/group/list?includeDeleted={bool}`
  Store:
* groupId, name, parentGroupId, deleted flag
  These become your internal **categories**.

6. **Products (Items)**

* `GET /v2/entities/products/list?includeDeleted=false`
  Store (minimum you must persist):
* `id`, `name`, `num (SKU)`, `code`, `type/productType`, `parent` (group), `mainUnit`, `unitCapacity` (liters), `defaultSalePrice`, `barcodes[]`, `deleted`, `notInStoreMovement`
  **Critical design choice** (you already described it and it’s correct): store full product JSON in `syrve_data` so you don’t explode your schema. 

7. **(Optional) Prices**

* `GET /v2/price?...` if you want *Syrve-true* prices by department / schedule / price categories.
  Not required for inventory counting, but useful for:
* inventory valuation report
* “by glass” margin calculations later

✅ Output of step B: your app has a complete product list + category tree.

---

#### C) First stock snapshot (to show “expected stock” at inventory start)

8. **Stock and sales (current stock)**

* `GET /v2/entities/products/stock-and-sales?storeIds=...&productIds=...` 
  Use this to create the **baseline** for the next inventory session:
* expected quantity on hand per product (for the selected store)

**Scaling note:** if Syrve requires productIds, you’ll batch by 200/500 IDs (whatever is safe). Cache results.

✅ Output of step C: you can show Manager “current stock from Syrve” and use it as the baseline for diff.

---

## 2) What your app can do with Syrve (Server API capability map)

You said: **no create/edit products/groups in Syrve** from your app. Perfect. We’ll treat Syrve as master data; your app is a layer for enrichment + inventory workflow + document submission.

### 2.1 Master data you can reliably READ and mirror

**Organization / branches**

* Departments (hierarchy), stores, groups, terminals
  Use cases:
* multi-restaurant setup
* per-store inventory
* role scoping (“user belongs to branch X”)

**Catalog**

* Product groups (categories) and products list
  Use cases:
* “import everything” or “select categories to include”
* auto-disable archived/deleted items (soft delete in your DB)

**Stock**

* stock-and-sales (current stock per store, optionally used at session start) 

**Prices (optional)**

* /v2/price to compute valuation and price-driven reports

---

### 2.2 The ONE core WRITE you need (inventory commit)

**Incoming Inventory document import**

* `POST /documents/import/incomingInventory` (XML payload)

That is your “Send to Syrve” button.

**Out of scope**: invoices — acknowledged.

---

## 3) Inventory workflow logic (matching your described UX + concurrency requirements)

### 3.1 Session start (Manager)

When Manager clicks **Start inventory**:

1. Create `inventory_session` (status=`in_progress`, storeId, createdBy, startedAt)
2. Pull **baseline stock snapshot** from Syrve for the chosen store (stock-and-sales) 
3. Build the “count list”:

   * all active products from your DB
   * optionally filtered by “included categories”
4. Freeze baseline in `inventory_session_baseline_items` (productId, expected_qty, expected_liters, expected_cost? optional)

**Important:** baseline is **read-only** and never changes during session.

### 3.2 Counting (multiple staff, chaotic location, no overwrites)

Your instinct is right: don’t allow one user to overwrite another.

Use this model:

* Every scan/manual add creates an **immutable event row**:

  * `inventory_count_event`

    * sessionId
    * userId
    * productId
    * bottle_qty (integer/decimal)
    * open_ml (decimal)
    * derived_liters
    * timestamp
    * source = camera_ai | manual_search | manual_barcode
    * optional: confidence score, photo url

Then you compute:

* per-user running totals (for UX)
* session totals (for manager review)

✅ This guarantees concurrency safety with zero locking.

### 3.3 Review + adjustments (Manager)

Manager view is:

* expected (baseline from Syrve) vs counted (sum of events)
* delta in bottles + liters
* per-product audit trail: who added what, when

Manager can:

* add “manager correction” events (same table, but tagged `source=manager_adjustment`)
* mark products as “counted/verified”
* close session → status=`completed`

### 3.4 Send to Syrve (Manager)

When Manager clicks **Send to Syrve**:

1. Validate:

   * session status completed
   * mapping exists for all products being sent (syrve_product_id present)
   * storeId selected
2. Aggregate totals:

   * `counted_qty_total = SUM(bottle_qty) + (open_ml / bottle_ml if you convert)`
   * also maintain liters if Syrve expects liters or container amount — your integration draft uses `amountContainer` 
3. Build XML incomingInventory document
4. POST to `/documents/import/incomingInventory`
5. Store:

   * request payload
   * response
   * Syrve doc number/id (if returned)
   * status in an outbox table

**Reliability rule:** implement an **outbox / retry queue** so “Send” is idempotent and resilient.

---

## 4) What you should import on first connection (data checklist)

### Must-have (for robust operations)

1. **Departments** (hierarchy) 
2. **Stores** (warehouse list) 
3. **Groups** (org grouping + optional sections)
4. **Product groups** (categories)
5. **Products list** (+ barcodes, unitCapacity, units, notInStoreMovement)
6. **Initial stock snapshot** (for the selected store) 

### Nice-to-have (unlocks better reporting/config)

7. **Prices** (valuation, glass margins, analytics)
8. **Restaurant sections** from groups response (optional “zones”) 

### Not reliably available via the snippets you provided (so handle in-app)

* language, currency, locale, tax rules — I don’t see a stable “get currency/language” endpoint in the provided Server API excerpts. So:

  * default from admin input (or auto-detect from UI locale)
  * store in `app_settings` per restaurant
  * later you can map to Syrve if you discover a reliable endpoint in full docs

---

## 5) Recommended data structure (DB schema / entities)

Below is a practical “v1 schema” that supports your current scope + future growth, without overengineering.

### 5.1 Connection & sync

**`syrve_connection`**

* id
* server_url
* login
* password_encrypted
* status (connected / failed)
* last_tested_at
* created_by

**`syrve_scope`**

* connection_id
* selected_store_id (Syrve UUID)
* selected_store_name
* selected_department_id (optional)
* selected_group_id (optional)

**`syrve_sync_log`**

* id, connection_id
* type (bootstrap/products/categories/stock/prices)
* started_at, finished_at
* counters created/updated/deactivated
* error_blob

---

### 5.2 Organization mirror

**`syrve_corporate_item`** (departments + stores, same dto family)

* syrve_id (UUID)
* type (CORPORATION/DEPARTMENT/STORE/SALEPOINT/…)
* code
* name
* parent_syrve_id
* raw_xml/json

**`syrve_group`**

* syrve_id
* name
* department_id (nullable)
* raw_xml (includes POS + restaurantSectionInfos) 

---

### 5.3 Catalog mirror

**`category`**

* id (internal)
* syrve_group_id
* name
* parent_syrve_group_id
* is_active
* syrve_data (json/xml)
* synced_at

**`product`**

* id (internal)
* syrve_product_id
* name
* sku (num)
* fast_code (code)
* syrve_group_id (parent)
* category_id (internal)
* product_type
* main_unit_id (uuid)
* unit_capacity_liters (decimal)  ← important for wine bottles 
* default_sale_price
* not_in_store_movement (bool) 
* is_deleted / is_active
* syrve_data (jsonb)
* synced_at

**`product_barcode`**

* product_id
* barcode
* is_primary
* source (syrve/manual)

---

### 5.4 Your enrichment layer (where you add value)

**`product_enrichment`**

* product_id
* image_url / image_asset_id
* wine_flags:

  * is_wine (bool)
  * served_by_glass (bool)
  * glass_size_ml_default (decimal)
  * bottle_size_ml (decimal) (default from unit_capacity_liters*1000 if available)
* custom_fields jsonb (grape, region, vintage, supplier, etc.)
* updated_by, updated_at

**`glass_config`**

* id
* name (e.g., “House glass 150ml”)
* size_ml
* applies_to (category_id or product_id or rule json)
* is_default

---

### 5.5 Inventory core

**`inventory_session`**

* id
* store_syrve_id
* status (in_progress/completed/sent/failed)
* started_at, completed_at, sent_at
* started_by, completed_by
* comment

**`inventory_baseline_item`**

* session_id
* product_id
* expected_qty (from Syrve)
* expected_liters
* raw_stock_payload (optional)

**`inventory_count_event`** (append-only)

* id
* session_id
* product_id
* user_id
* bottle_qty
* open_ml
* derived_liters
* source (ai/manual/manager_adjustment)
* created_at
* metadata jsonb (confidence, photo, notes)

**`inventory_session_product_agg`** (materialized / cached view)

* session_id
* product_id
* counted_qty_total
* counted_liters_total
* last_updated_at

(You can compute this live, or maintain via triggers/jobs.)

---

### 5.6 Outbox for Syrve sends (critical reliability)

**`syrve_outbox`**

* id
* session_id
* document_type = incomingInventory
* payload_xml
* status (pending/sent/failed)
* attempts
* last_error
* syrve_response
* created_at, updated_at

This prevents “button spam”, supports retries, and lets you show “sent / failed” clearly.

---

## 6) Feature list you can implement now (realistic + valuable)

### Fast setup (Admin)

* Connect Syrve
* Auto-fetch and **choose store/department**
* Import categories/products
* Category inclusion rules (“only Wine categories”)
* Initial stock snapshot

### Inventory (Staff + Manager)

* Start session (manager only)
* Staff scanning with AI label recognition + manual search
* Open bottle input in ml
* Per-user progress screen (“your counted items”)
* Manager review screen with:

  * expected vs counted vs delta
  * audit log
  * manager adjustments
* Close + Send to Syrve (incomingInventory)

### Product enrichment (Admin)

* Upload images / attach image per product
* Mark “served by glass”
* Configure glasses and bottle sizes
* History timeline per product (counts over time)

### Reporting (Manager)

* Inventory history by session
* Shrinkage / overage
* Top variance products
* (Optional) valuation using prices if you sync `/v2/price` 

---

## 7) Practical “don’t get burned” notes (from Syrve realities)

* **Always logout** after sync actions to avoid license/session exhaustion. 
* Treat `deleted` and “archived/limited-time wines” as:

  * keep in DB but mark inactive
  * keep historical inventory references valid
* Respect `notInStoreMovement` — those items should likely be excluded from inventory flows because Syrve says they don’t participate in store movements. 
* Store full Syrve payload (`syrve_data`) to avoid schema churn when Syrve adds fields. 

