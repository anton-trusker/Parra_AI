

# Syrve Integration Improvements

## Summary

Enhance the Syrve Settings page with smarter category filtering, better re-import options, refresh buttons per section, a "Clean All" reset, dynamic product type detection, and fixes to ensure full category hierarchy import with proper parent linking.

---

## Changes Overview

### 1. Categories: Show "with products" by default + toggle to view all

- Add a `product_count` indicator per category by querying `products` table grouped by `category_id`
- Default the category picker to highlight/filter categories that have products in the selected warehouses
- Add a toggle: "Show categories with products" (default ON) vs "Show all categories"
- This is a frontend-only enhancement on the CategoryTreePicker component

### 2. Refresh buttons on Warehouses and Categories sections

- Add a small refresh icon button next to each section header (Warehouses, Categories)
- Clicking it calls `syrve-sync` with `sync_type: 'stores'` or `sync_type: 'categories'` respectively, re-fetching from Syrve and updating the DB
- After completion, invalidate the relevant query cache to update the picker

### 3. Improved Re-import Mode (compact UI + clearer options)

Replace the current 4-option grid (merge/hide/replace/fresh) with 2 clear actions:

- **"Save & Import"** (default button) -- Imports new products, updates existing ones. Products no longer matching the selection are marked `is_active = false` (soft deactivate, data preserved). They won't show in results but data remains.
- **"Clean Import"** -- A separate destructive button that deletes ALL Syrve-sourced data (products, barcodes, stock_levels, categories, stores, measurement_units, syrve_raw_objects) and runs a fresh bootstrap import from scratch.

This replaces the confusing merge/hide/replace/fresh grid with two clear, distinct actions.

### 4. "Clean All Data" button

- Add a "Clean All Syrve Data" button (with confirmation dialog) that truncates all Syrve integration tables:
  - `products` (where syrve_product_id is not null)
  - `product_barcodes` (source = 'syrve')
  - `stock_levels` (source = 'syrve')
  - `categories`
  - `stores`
  - `measurement_units`
  - `syrve_raw_objects`
  - `syrve_sync_runs`
  - `syrve_api_logs`
- Resets `syrve_config.connection_status` to `'not_configured'`
- This effectively returns the system to a pre-integration state

### 5. Dynamic product types from Syrve

- Currently the `PRODUCT_TYPES` list is hardcoded to 5 values (GOODS, DISH, MODIFIER, PREPARED, SERVICE)
- During `syrve-connect-test`, extract unique product types from the fetched product list and return them
- On the frontend, merge hardcoded defaults with any additional types discovered from Syrve
- Alternative (simpler): query distinct `product_type` from `products` table and from `syrve_raw_objects` to build the list dynamically

### 6. Full category import verification

**Current issue**: The category sync uses `/v2/entities/products/group/list` which returns product groups. Per the Syrve API docs, there's also `rootType=ProductGroup` via `/v2/entities/list`. The current endpoint should return the full hierarchy.

**Fix**: Ensure the `syncCategories` function and `syrve-connect-test` category import:
- Use `includeDeleted=true` to get ALL groups (then mark deleted ones as inactive)
- Parse both `parentId` and `parent` fields from the response (already done)
- After upserting, re-resolve ALL parent_id references (not just those with parent_syrve_id) to catch any orphaned links
- Add logging of how many root vs child categories were imported

### 7. Parent/UUID linking verification in sync

- After category sync: verify all `parent_syrve_id` values resolve to valid `parent_id` UUIDs. Log any orphans.
- After product sync: verify all `main_unit_id` values are resolved from Syrve GUIDs to internal UUIDs. Log any unresolved.
- After stock sync: verify `store_id` and `product_id` references are valid.

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SyrveSettings.tsx` | Add refresh buttons, replace reimport grid with 2 buttons, add Clean All button, dynamic product types, category filter toggle |
| `src/components/syrve/CategoryTreePicker.tsx` | Add `productCounts` prop and "show with products" toggle filter |
| `src/hooks/useSyrve.ts` | Add `useCategoryProductCounts()` hook, add `useCleanAllSyrveData()` mutation |
| `supabase/functions/syrve-connect-test/index.ts` | Extract unique product types, include in response |
| `supabase/functions/syrve-sync/index.ts` | Update `syncCategories` to use `includeDeleted=true`, add orphan parent logging, improve `applyReimportMode` to use soft-deactivate by default, add clean import support |

### New Hook: `useCategoryProductCounts`

```typescript
// Returns Map<category_id, product_count> for categories that have products
useQuery({
  queryKey: ['category_product_counts'],
  queryFn: async () => {
    const { data } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true)
      .not('category_id', 'is', null);
    // Count per category_id
    return countMap;
  }
});
```

### New Mutation: `useCleanAllSyrveData`

Calls a series of delete operations via the Supabase client to clean all Syrve-related tables, then resets config status.

### Edge Function Changes

**`syrve-connect-test`**: After fetching products list (lightweight -- just to extract types), collect unique `type`/`productType` values and return as `product_types: string[]` in the response.

**`syrve-sync`**: 
- Default reimport behavior changed: non-matching products get `is_active = false` instead of being deleted
- Add `sync_type: 'clean_import'` that first cleans all data then runs bootstrap
- Add parent resolution verification with console logging

