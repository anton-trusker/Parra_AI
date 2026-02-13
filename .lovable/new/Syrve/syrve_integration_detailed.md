# Syrve (iiko) Integration - Detailed Implementation Guide

## 1. Overview
This document details the technical implementation of the integration between our Wine Inventory System and Syrve (formerly iiko). The primary goals are:
1.  **Catalog Synchronization**: Mapping local wines to Syrve products.
2.  **Inventory Reconciliation**: Comparing local physical counts with Syrve's theoretical stock.
3.  **Stock Updates**: Pushing actual counts back to Syrve to correct inventory levels.

## 2. Database Schema Extensions

To support this integration, we need specific tables for configuration, mapping, and logging.

### 2.1 Configuration
**Table**: `integration_syrve_config`
Stores authentication credentials and global settings.
```sql
CREATE TABLE integration_syrve_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_login TEXT NOT NULL,
    base_url TEXT NOT NULL DEFAULT 'https://api-eu.iiko.services',
    organization_id TEXT, -- Main organization ID to interact with
    default_store_id TEXT, -- Fallback store ID
    sync_interval_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Product Cache & Mapping
**Table**: `integration_syrve_products`
Caches the Syrve nomenclature to avoid constant heavy API calls and facilitates mapping.
```sql
CREATE TABLE integration_syrve_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_product_id TEXT NOT NULL UNIQUE, -- 'id' from Syrve nomenclature
    parent_group_id TEXT,
    name TEXT NOT NULL,
    product_code TEXT, -- 'code' from Syrve (often used as SKU)
    measure_unit TEXT,
    price NUMERIC,
    product_type TEXT, -- 'GOODS', 'DISH', etc.
    is_deleted BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for mapping lookups
CREATE INDEX idx_syrve_products_code ON integration_syrve_products(product_code);
CREATE INDEX idx_syrve_products_name ON integration_syrve_products(name);
```
*Note*: The actual link to our wines is stored in `wine_variants.syrve_product_id`.

### 2.3 Store/Location Mapping
**Table**: `integration_syrve_stores`
Maps our local `locations` (e.g., "Cellar 1") to Syrve `stores` (warehouses).
```sql
CREATE TABLE integration_syrve_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    syrve_store_id TEXT NOT NULL,
    syrve_store_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id)
);
```

### 2.4 Sync History & Session Linking
**Table**: `integration_syrve_sync_log`
Audit trail of all API interactions.
```sql
CREATE TABLE integration_syrve_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'AUTH', 'FETCH_PRODUCTS', 'CHECK_INVENTORY', 'PUSH_DOC'
    status TEXT NOT NULL, -- 'SUCCESS', 'ERROR'
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Table**: `inventory_session_syrve_map`
Links a local inventory session to the resulting Syrve document.
```sql
CREATE TABLE inventory_session_syrve_map (
    session_id UUID REFERENCES inventory_sessions(id) PRIMARY KEY,
    syrve_document_id TEXT, -- UUID of the created document in Syrve
    syrve_document_number TEXT,
    sync_status TEXT DEFAULT 'PENDING', -- 'CHECKED', 'COMMITTED', 'FAILED'
    synced_at TIMESTAMP WITH TIME ZONE
);
```

## 3. Authentication Flow

Syrve uses token-based authentication.

1.  **Login**: `POST /api/1/access_token`
    *   **Body**: `{ "apiLogin": "<integration_syrve_config.api_login>" }`
    *   **Response**: `{ "token": "...", "tokenLifeTime": 3600 }`
2.  **Storage**: Cache the token in memory/Redis (not DB) with an expiry slightly less than `tokenLifeTime`.
3.  **Usage**: Add `Authorization: Bearer <token>` header to all subsequent requests.
4.  **Refresh**: On 401 Unauthorized or before expiry, call Login again.

## 4. Workflows

### 4.1. Catalog Sync (Scheduled)
**Goal**: Keep `integration_syrve_products` up to date.
**Frequency**: Daily or On-Demand.

1.  **Fetch**: `POST /api/1/nomenclature`
    *   **Params**: `{ "organizationId": "...", "startRevision": 0 }`
2.  **Process**:
    *   Iterate through `products` array.
    *   Upsert into `integration_syrve_products`.
3.  **Map**:
    *   Run `mapSyrveToWines()` logic:
        *   Find `wine_variant` where `primary_barcode` matches `syrve_product.code`.
        *   If no match, try fuzzy name match.
        *   Update `wine_variants.syrve_product_id`.

### 4.2. Inventory Check (Live Variance)
**Goal**: Before closing a session, check discrepancies against Syrve's *current* theoretical stock.
**Endpoint**: `POST /api/1/documents/check/incomingInventory`

1.  **Trigger**: User clicks "Review & Finalize" in an Inventory Session.
2.  **Prepare Payload** (`incomingInventoryDto`):
    *   `organizationId`: Configured ID.
    *   `dateIncoming`: Session completion date.
    *   `items`: List of items. For each counted item:
        *   `productId`: `wine_variants.syrve_product_id`
        *   `amount`: `counted_quantity_unopened`
        *   `amountUnit`: Syrve unit ID (fetch from product cache).
        *   `store`: Mapped Syrve store ID for the session's location.
3.  **Send Request**: This is a dry-run validation.
4.  **Parse Response** (`validationResult`):
    *   Syrve returns "Expected" amounts for the given date/store.
    *   We compare `Response.expected` vs `Our.counted`.
    *   Display "Syrve Variance" in the UI alongside local variance.

**XML Payload Example (Check)**:
```xml
<document>
  <dateIncoming>2023-10-27T10:00:00</dateIncoming>
  <store>GUID-OF-STORE</store>
  <items>
    <item>
      <product>GUID-OF-PRODUCT</product>
      <amount>12</amount> <!-- Implementation Note: This is ACTUAL count -->
    </item>
  </items>
</document>
```
*Note: The check endpoint might return warnings if stock goes negative or logic violations occur.*

### 4.3. Inventory Commit (Finalize)
**Goal**: Update Syrve stock levels to match our physical count.
**Method**: We use **Incoming Inventory** to reset stock or **Write-Off** to adjust?
*Best Practice for Full Inventory*: `IncomingInventory` document acts as a "Stock Taking" document in some configurations, but typically in Syrve API `Inventory` functionality is complex.
*Alternative*: Create a **Write-Off** document for shortages and **Incoming Invoice** (or Surplus) for overages.
*Simpler Approach*: Use the `Inventory` document type if supported by API version, or standard `documents/import/incomingInventory` if it acts as a "set stock to X" (requires verification with specific Syrve configuration).

**Assumption**: We will use `documents/import/incomingInventory` treating it as a "Stock Taking" or "Inventory Correction" document if the Syrve instance allows, OR we calculate the diff and send adjustments.

**Recommended Flow (Diff approach)**:
1.  Calculate Diff: `Counted - SyrveExpected` (obtained from Step 4.2).
2.  If `Diff < 0` (Shortage):
    *   Create `WriteOff` Document (`/documents/import/writeoff`).
    *   Items: `{ product: id, amount: abs(diff) }`.
3.  If `Diff > 0` (Surplus):
    *   Create `IncomingInvoice` or `Posting` Document (`/documents/import/incomingInvoice` equivalent for surplus).
    *   Items: `{ product: id, amount: diff }`.

**Direct Inventory Document (If available)**:
If the API supports importing an "Inventory" document directly (often called "StockTaking" or "InventoryCorrection"), we send the full counts.
*Ref*: `POST /api/1/documents/import/inventory` (Need to verify availability in specific API version).

**Implementation Decision**:
Given the docs available (`Documents.md`), we see `incomingInvoice`, `outgoingInvoice`, `salesDocument`. The `check/incomingInventory` suggests `incomingInventory` is the primary method for bringing stock *in*.
To be safe and typically compliant with accounting:
*   **Use `WriteOff` for losses.**
*   **Use `IncomingInvoice` (with a specific "Surplus" supplier) for gains.**

### 5. Error Handling
- **401 Unauthorized**: Refresh token and retry.
- **404 Product Not Found**: Log error, flag wine in UI as "Sync Error - Not in Syrve".
- **429 Too Many Requests**: Exponential backoff (1s, 2s, 4s).
- **XML Validation Errors**: Store full error XML in `integration_syrve_sync_log` and alert admin.

## 6. Next Steps
1.  Run migration to create the tables defined in Section 2.
2.  Implement the `SyrveClient` class in TypeScript with `login`, `fetchCatalog`, `checkInventory` methods.
3.  Build the "Map Wines" UI page.
