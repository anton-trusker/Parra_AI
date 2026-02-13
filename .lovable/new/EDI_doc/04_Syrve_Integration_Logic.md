# 04 - Syrve Integration Logic

## 1. Sync Workflow (The "Bootstrap")

The synchronization process is responsible for mirroring Syrve's master data into Supabase.

### Step 1: Organization Structure
**Endpoint**: `GET /corporation/stores`
**Target Table**: `stores`

*   Store `id` (Syrve UUID) -> `syrve_store_id`.
*   Store `name` -> `name`.
*   Active status -> `is_active`.

### Step 2: Product Groups (Categories)
**Endpoint**: `GET /api/1/nomenclature` (XML)
**Target Table**: `categories`

*   Parse `<productGroup>` tags.
*   `id` (Syrve UUID) -> `syrve_group_id`.
*   `name` -> `name`.
*   `parentGroup` -> `syrve_parent_group_id`.
*   **Upsert** with `onConflict: syrve_group_id`.

### Step 3: Products
**Endpoint**: `GET /api/1/nomenclature` (XML)
**Target Table**: `products` & `integration_syrve_products`

**Mapping Rules**:
*   `id` -> `syrve_product_id`.
*   `name` -> `name`.
*   `num` -> `sku`.
*   `type` -> `product_type` (GOODS/DISH).
*   `mainUnit` -> `base_unit_name`.
*   **Syrve Layer**: Store snippet in `integration_syrve_products.raw_data`.
*   **Enrichment**: Auto-extract **Vintage** from name: `(19|20)\d{2}`.
*   **Initialization**: Insert into `wines` table if missing to allow immediate sensory notes entry.

### Step 4: Barcodes
**Source**: `barcodes` array in Product JSON.
**Target Table**: `product_barcodes`

*   For each barcode in the array, insert a row linked to the product.

## 2. Inventory Session Logic

### Starting a Session
1.  **Create Session**: Insert into `inventory_sessions` (Status: `in_progress`).
2.  **Fetch Baseline**: Call Syrve `GET /v2/entities/products/stock-and-sales` for the selected `store_id`.
3.  **Freeze Baseline**: Insert results into `inventory_baseline_items`.
    *   This is the "Expected" count.
    *   It **never changes** even if Syrve stock changes during the count.

### Counting (The Event Log)
We do not update a "current count" field. We insert **Events**.

**Scenario**: User scans a bottle.
1.  **Lookup**: Find `product_id` via Barcode.
2.  **Insert**: `inventory_count_events`
    *   `bottles`: 1
    *   `open_volume`: 0
    *   `method`: `scan`
3.  **Aggregation**:
    *   A Database Trigger (or View) sums up all events for the session.
    *   `Total Count` = Sum(`bottles`) + Sum(`open_volume` / `bottle_size`).

**Scenario**: Manager Correction.
1.  Manager sees "Counted 5, Expected 4".
2.  Manager realizes one bottle was empty.
3.  **Insert**: `inventory_count_events`
    *   `bottles`: -1 (Negative value!)
    *   `method`: `adjustment`
4.  **New Total**: 4.

### Closing & Variance
*   **Variance** = `Aggregated Count` - `Baseline Expected`.
*   This is computed on the fly or verified in `inventory_product_aggregates`.

## 3. Submission to Syrve (The Outbox)

We do not hold the user's browser open while waiting for Syrve.

1.  **User Action**: Clicks "Submit to Syrve".
2.  **System Action**:
    *   Validates session is `completed`.
    *   Generates the XML payload for `incomingInventory`.
    *   Inserts row into `syrve_outbox_jobs` (Status: `pending`).
    *   Updates Session Status to `synced` (optimistic) or `sending`.
3.  **Worker Action (Edge Function)**:
    *   Polls/Triggered by `syrve_outbox_jobs`.
    *   Authenticates with Syrve.
    *   POSTs the XML.
    *   **If Success**:
        *   Update Job Status -> `success`.
        *   Save `syrve_doc_id` from response.
    *   **If Check Fail** (Business logic error):
        *   Update Job Status -> `failed`.
        *   Save `last_error`.
        *   Notify Manager.
    *   **If Network Fail**:
        *   Increment `attempts`.
        *   Leave as `pending` (will retry).

## 4. Volume Calculation Logic

How do we know a "bottle" is 750ml?

**Priority Hierarchy**:
1.  **Product Override**: Check `product_serving_rules` for a specific `bottle_size_ml` for this `product_id`.
2.  **Category Rule**: Check `product_serving_rules` for this `category_id`.
3.  **Syrve Default**: Use `products.unit_capacity`.
    *   If `unit_capacity` < 10 (e.g. 0.75), assume Liters -> `0.75 * 1000 = 750ml`.
    *   If `unit_capacity` > 10 (e.g. 750), assume ML -> `750ml`.
4.  **Fallback**: Default to 750ml.
