
# Enhanced Syrve Data Integration: Prices, Stock & Import Configuration

## Overview

All 93 imported products currently have **zero prices** and **no stock levels** because the sync only fetches the product list endpoint (`/entities/products/list`), which returns `defaultSalePrice: 0`. Real prices come from the `/v2/price` endpoint and stock levels from `/v2/entities/products/stock-and-sales`. Additionally, the import settings page needs new toggles so users can control what data gets fetched.

## What Changes

### 1. Database Migration -- Add Price & Stock Columns to `products`

New columns:
- `purchase_price` (NUMERIC) -- estimated purchase price from Syrve price list
- `sale_price` (NUMERIC) -- actual sale price from Syrve price list
- `current_stock` (NUMERIC, default 0) -- current stock balance from Syrve
- `price_updated_at` (TIMESTAMPTZ) -- when prices were last fetched
- `stock_updated_at` (TIMESTAMPTZ) -- when stock was last fetched

### 2. Edge Function: `syrve-sync` -- Add Two New Sync Stages

After importing products (progress 80%), add:

**Stage: Fetching Prices (85%)**
- Call `GET /resto/api/v2/price?key={token}` 
- Parse the response (XML format) for price items containing `productId`, `price` (sale), and optionally purchase price
- Batch-update `products.sale_price`, `products.purchase_price`, and `products.default_sale_price`
- Track stats: `stats.prices_updated`

**Stage: Fetching Stock (90%)**
- Call `GET /resto/api/v2/entities/products/stock-and-sales?key={token}&storeIds={default_store_id}`
- Batch product IDs in groups of 200 (API limitation)
- Parse XML for `<item>` blocks with `<productId>`, `<balance>`
- Update `products.current_stock`
- Track stats: `stats.stock_updated`

**Controlled by new `field_mapping` flags:**
- `sync_prices` (default: true) -- whether to fetch prices
- `sync_stock` (default: true) -- whether to fetch stock

Only runs if `default_store_id` is configured (for stock).

### 3. Edge Function: `syrve-stock-snapshot` -- Fix Endpoint

Current code uses wrong endpoint:
```
/reports/balance/stores?key={token}&store={id}&timestamp={date}
```
Correct endpoint per documentation:
```
/v2/entities/products/stock-and-sales?key={token}&storeIds={storeId}
```

Also fix XML parsing to match the correct response format (`<item>` with `<productId>`, `<balance>` fields).

### 4. Frontend: SyrveSettings Import Rules -- Add New Toggles

Add to the "Import Rules" section (section 4):

**New "Data Sync Options" subsection** with toggles for:
- **Sync Prices** -- Fetch sale and purchase prices from Syrve (`/v2/price`)
- **Sync Stock Levels** -- Fetch current stock balances (`/v2/entities/products/stock-and-sales`). Requires a default store to be selected.

These are stored in `field_mapping.sync_prices` and `field_mapping.sync_stock`.

**Update progress stage badges** to include the new stages:
- `fetching_prices` -- "Fetching Prices"
- `fetching_stock` -- "Fetching Stock"

### 5. Sync Progress Stages (Updated Order)

```text
1. Authenticate          (5%)
2. Sync Stores          (15%)
3. Sync Categories      (30%)
4. Delete Products      (40-50%) -- if fresh mode
5. Import Products      (55-75%)
6. Fetch Prices         (80%)    -- NEW
7. Fetch Stock          (85%)    -- NEW
8. Apply Reimport Mode  (90%)
9. Complete            (100%)
```

---

## Technical Details

### Files to modify:
- `supabase/functions/syrve-sync/index.ts` -- Add `syncPrices()` and `syncStock()` functions
- `supabase/functions/syrve-stock-snapshot/index.ts` -- Fix endpoint URL and XML parsing
- `src/pages/SyrveSettings.tsx` -- Add sync_prices/sync_stock toggles, update stage badges
- `src/hooks/useSyrve.ts` -- Update `SyrveConfig` interface with new product columns

### Migration SQL:
```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS current_stock NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_updated_at TIMESTAMPTZ;
```

### New sync functions in `syrve-sync`:

**`syncPrices(client, baseUrl, token, syncRunId, stats)`**
- Calls `/v2/price?key={token}`
- Parses XML response for price items
- Batch-updates products by matching `syrve_product_id`

**`syncStock(client, baseUrl, token, syncRunId, stats, storeId)`**
- Fetches all product syrve_product_ids from DB
- Batches into groups of 200
- Calls `/v2/entities/products/stock-and-sales?key={token}&storeIds={storeId}&productIds={batch}`
- Parses `<item>` blocks for `<productId>` and `<balance>`
- Batch-updates `products.current_stock`

### Updated stats object:
```json
{
  "stores": 2,
  "categories": 135,
  "products": 93,
  "barcodes": 45,
  "prices_updated": 93,
  "stock_updated": 93,
  "skipped": 12,
  "errors": 0
}
```
