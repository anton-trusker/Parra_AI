
# Separate Product Types with Enriched Views and Default Stock Filter

## Overview

Split the unified product catalog into dedicated pages for **Goods** and **Dishes**, each backed by its own database view that extracts commonly needed fields from `syrve_data` JSON. The Products page defaults to showing only items with available stock. Categories get type-aware tabs. The Syrve integration settings gain per-type category selection.

## Current State

- 1,370 GOODS products (391 with stock > 0)
- 1,399 DISH products (1 with stock > 0)
- One `v_stock_summary` view exists for GOODS with stock > 0
- ProductCatalog page has Goods/Dishes tabs in one view
- Categories page shows all categories as one tree
- `syrve_data` JSON contains useful fields that are parsed in frontend code (containers, mainUnit, parent, unitWeight, etc.)

## Planned Changes

### 1. Database: Create Two Enriched Views

**`v_goods_catalog`** -- All GOODS products with extracted syrve_data fields:

```text
Columns:
  product_id, name, sku, code, category_id, category_name,
  main_unit_id, unit_capacity, purchase_price, sale_price,
  is_active, parent_product_id, synced_at,
  -- Extracted from syrve_data:
  syrve_id, container_name, container_count (volume per container),
  unit_weight, accounting_category_id,
  -- Aggregated from stock_levels:
  total_stock, total_value, store_count
```

**`v_dishes_catalog`** -- All DISH/PREPARED products with extracted fields:

```text
Columns:
  product_id, name, sku, code, category_id, category_name,
  main_unit_id, unit_capacity, sale_price, default_sale_price,
  is_active, parent_product_id, synced_at,
  -- Extracted from syrve_data:
  syrve_id, unit_weight, place_type, included_in_menu,
  -- Resolved from parent:
  parent_name, parent_product_type
```

**`selected_category_ids_by_type`** -- Add JSONB column to `syrve_config` for per-type category selections.

### 2. Navigation Changes

Update sidebar and routes:

```text
Inventory
  Products        /products        (GOODS only, default: in-stock)
  Dishes          /dishes          (DISH/PREPARED)
  Stock           /stock           (unchanged)
  Categories      /categories      (tabbed: Goods | Dishes)
  By Store        /inventory/by-store
  Sessions        /inventory/checks
  Count Now       /count
  AI Scans        /inventory/ai-scans
```

### 3. Products Page (Goods Only)

Refactor `ProductCatalog.tsx`:
- Remove Goods/Dishes tab switcher
- Query from `v_goods_catalog` view instead of joining products + stock_levels in hooks
- **Default filter: show only products with stock > 0** (toggle "Show all" to see zero-stock items)
- Stats cards update: Total Goods, In Stock, Low Stock, Out of Stock
- Container info comes directly from view columns (no more JSON parsing in render)
- Quick filter chips: "In Stock" (default active), "Low Stock", "Out of Stock", "No Price"

### 4. New Dishes Page

Create `src/pages/DishesPage.tsx`:
- Query from `v_dishes_catalog` view
- Columns: Name, Code, Category, Linked Goods (parent_name), Sale Price, Default Sale Price, Unit, Volume, In Menu, Synced At
- Stats: Total Dishes, Linked to Goods, Unlinked, With Price
- Quick filters: "No Price", "Unlinked", "Not in Menu"
- Row click navigates to `/products/:id` (detail page already handles both types)

### 5. Categories Page -- Tabbed by Type

Update `CategoriesPage.tsx`:
- Add tabs: "Goods" and "Dishes"
- Pass `productType` filter to `useCategoriesWithCounts` hook
- Each tab shows only categories containing products of that type (and their ancestors)
- Product counts reflect only the relevant type

### 6. Syrve Settings -- Per-Type Category Selection

Update the import configuration section:
- After selecting product types, show a separate `CategoryTreePicker` for each selected type
- Save selections to `selected_category_ids_by_type` JSONB field
- Fall back to `selected_category_ids` when the new field is absent

### 7. Hook Updates

- Add `useGoodsCatalog(search?, showAll?)` hook querying `v_goods_catalog`
- Add `useDishesCatalog(search?)` hook querying `v_dishes_catalog`
- Update `useCategoriesWithCounts` to accept optional `productType` parameter
- Keep existing `useProducts` for backward compatibility (used in count, detail, etc.)

---

## Technical Details

### New Database Objects (Migration)

| Object | Type | Purpose |
|--------|------|---------|
| `v_goods_catalog` | VIEW | Enriched goods with extracted JSON + aggregated stock |
| `v_dishes_catalog` | VIEW | Enriched dishes with parent resolution |
| `selected_category_ids_by_type` | COLUMN | Per-type category selection in syrve_config |

### New Files

| File | Purpose |
|------|---------|
| `src/pages/DishesPage.tsx` | Dedicated dishes catalog page |
| `src/hooks/useCatalogViews.ts` | Hooks for the two new views |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/dishes` route |
| `src/components/AppSidebar.tsx` | Add "Dishes" nav item with UtensilsCrossed icon |
| `src/pages/ProductCatalog.tsx` | Remove tabs, use `v_goods_catalog`, default in-stock filter |
| `src/pages/CategoriesPage.tsx` | Add Goods/Dishes tabs |
| `src/hooks/useProducts.ts` | Add `productType` param to `useCategoriesWithCounts` |
| `src/pages/SyrveSettings.tsx` | Per-type CategoryTreePicker sections |
| `src/hooks/useSyrve.ts` | Support `selected_category_ids_by_type` |
| `supabase/functions/syrve-sync/index.ts` | Read per-type category selections |

### View SQL Design

**v_goods_catalog** key extractions from syrve_data:
- `(syrve_data->'containers'->0->>'name')` as container_name
- `(syrve_data->'containers'->0->>'count')::numeric` as container_count
- `(syrve_data->>'unitWeight')::numeric` as unit_weight
- `(syrve_data->>'accountingCategory')` as accounting_category_id
- Stock aggregated via LEFT JOIN on stock_levels with store_count

**v_dishes_catalog** key extractions:
- `(syrve_data->>'defaultIncludedInMenu')::boolean` as included_in_menu
- `(syrve_data->>'unitWeight')::numeric` as unit_weight
- `(syrve_data->>'placeType')` as place_type
- Parent product name resolved via LEFT JOIN on products

### Default Stock Filter Behavior

The Products page adds a `showAll` boolean state (default: `false`). When `false`, the query includes `total_stock > 0` filter. A toggle button "Show all products" / "In stock only" switches this. The existing `v_stock_summary` view will be kept for backward compatibility but the new `v_goods_catalog` replaces its usage on the Products page.
