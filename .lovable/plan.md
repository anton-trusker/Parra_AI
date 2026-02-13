

# Wine Enrichment Pipeline: Two-Table Architecture with Bidirectional Inventory Sync

## Overview

When products are imported from Syrve and belong to "Wine Categories" (configured in Syrve Settings), the system will automatically **copy and enrich** data into the `wines` table, linked back to the source product via `product_id`. The two tables remain independent: Syrve syncs update `products` (raw data), while `wines` holds the curated, enriched catalog. Inventory data (stock levels) flows **both ways** -- Syrve stock updates flow into wines, and inventory count results from the app can be pushed back to Syrve.

---

## 1. Database Migration

Add linking and enrichment columns to the existing `wines` table:

```sql
ALTER TABLE public.wines
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS syrve_product_id text,
  ADD COLUMN IF NOT EXISTS enrichment_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS raw_source_name text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wines_product_id
  ON public.wines(product_id) WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wines_syrve_product_id
  ON public.wines(syrve_product_id) WHERE syrve_product_id IS NOT NULL;
```

- `product_id`: 1:1 link to `products` table (the Syrve import)
- `syrve_product_id`: stored for direct Syrve reference
- `enrichment_source`: `syrve_auto` | `manual` | `ai` | `csv`
- `enrichment_status`: `pending` | `enriched` | `reviewed`
- `raw_source_name`: original unmodified product name from Syrve

---

## 2. Name Parsing & Enrichment Engine

A utility function (inside the syrve-sync edge function) will parse raw Syrve product names and extract structured wine data:

| What | Pattern Examples | Result |
|---|---|---|
| Volume | `0.75`, `0,75`, `750ml`, `1.5L` | `volume_ml: 750` |
| By Glass | `by glass`, `бокал`, `150ml` | `available_by_glass: true` |
| Vintage | `2018`, `2021` (4-digit year 1900-2099) | `vintage: 2018` |
| Cleanup | Remove extracted tokens, trim | `name: "Merlot Reserva"` (Title Case) |

After parsing, the cleaned name is Title Cased and stored in `wines.name`, while the original goes into `raw_source_name`.

Prices (`sale_price`, `purchase_price`) and SKU are copied from the product row.

---

## 3. Integration into Syrve Sync

At the end of the `syrve-sync` edge function (after products, prices, and stock are synced), add a new stage: **`enriching_wines`** (~93% progress).

Logic:
1. Load `syrve_config.settings.wine_category_ids` (the Wine Categories picker value)
2. Query `products` in those categories that do NOT yet have a linked `wines` entry (by checking `product_id` in wines)
3. For each unlinked product:
   - Run the parsing engine on `product.name`
   - Extract volume from `syrve_data.containers` if not found in name
   - Copy prices, SKU, barcode
   - Insert into `wines` with `enrichment_source = 'syrve_auto'`
4. For already-linked wines: update stock and prices from product (but NOT name/metadata -- those are user-curated)

This ensures:
- New wine products get auto-created in `wines`
- Existing wines get fresh stock/price data from Syrve
- Manual edits to wine metadata are never overwritten

---

## 4. Bidirectional Inventory Sync

### Syrve -> App (already exists, enhanced)
- Syrve stock report updates `products.current_stock`
- New: propagate `products.current_stock` to linked `wines.current_stock_unopened` during sync

### App -> Syrve (existing outbox pattern)
- When an inventory session is approved and submitted, the `inventory-submit-to-syrve` function already builds the document and queues it in `syrve_outbox_jobs`
- The `syrve-process-outbox` function sends it to Syrve
- After successful submission, update both `wines` and `products` stock levels from the counted data

### Stock Reconciliation Flow

```text
Syrve Server
    |
    v (OLAP stock report)
products.current_stock  ------>  wines.current_stock_unopened
    ^                                    |
    |                            (inventory count session)
    |                                    v
syrve_outbox_jobs  <------  inventory_product_aggregates
```

---

## 5. Frontend Changes

### Wine Catalog (`WineCatalog.tsx`)
- Show enrichment source badge (Auto / Manual / AI) on each wine card
- Show linked product indicator

### Wine Detail (`WineDetail.tsx`)
- Display `raw_source_name` for reference
- Show linked Product ID with navigation link
- Show enrichment status

### Product Catalog (`ProductCatalog.tsx`)
- Add a wine glass icon on products that have a linked wine entry
- Clicking it navigates to the wine detail

### Syrve Settings
- No changes needed -- the Wine Categories picker already exists and its value will be read by the sync function

---

## 6. Updated Hooks

### `useWines.ts`
- Join with `products` via `product_id` to pull real-time stock and prices
- Add `enrichment_source` and `enrichment_status` to query select

### New: `useWineEnrichment.ts`
- `useEnrichWines()` mutation: manually trigger enrichment for selected products
- `useWineProductLink(wineId)`: fetch the linked product details

---

## 7. Implementation Sequence

1. **Database migration** -- add `product_id`, `syrve_product_id`, `enrichment_source`, `enrichment_status`, `raw_source_name` to `wines`
2. **Update `syrve-sync` edge function** -- add enrichment stage after product/price/stock sync
3. **Update `useWines` hook** -- join product data for stock/prices
4. **Update Wine Catalog UI** -- enrichment badges, linked product indicators
5. **Update Product Catalog UI** -- wine link icon
6. **Update inventory submission** -- bidirectional stock update on both `products` and `wines` tables after inventory count

