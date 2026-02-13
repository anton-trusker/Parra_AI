

# Comprehensive Feature Build: Products, Categories, Inventory & Settings Enhancements

## Overview

This plan covers 6 major workstreams: improving the Syrve integration UI (category delete, partial selection visuals), building Product Catalog and Categories pages, building the full Inventorisation workflow, persisting column/filter preferences to the database, and adding a "hide scanning on desktop" setting.

---

## 1. Syrve Integration UI Improvements

### 1a. Category Deletion
- Add a delete button (trash icon) per category row in `CategoryTreePicker`
- Create a new hook `useDeleteCategory` that sets `is_active = false` and `is_deleted = true` on the category and all its children
- Show confirmation dialog before delete (warn about child categories)
- Invalidate `syrve_categories` query after delete

### 1b. "Import Only Selected" clarity
- Currently the tree picker says "Leave empty to import all" -- this stays but gets a visual overhaul
- Add a summary bar at the top: "Importing: 12 of 135 categories" or "Importing: All categories"

### 1c. Partial Selection Visual Indicators
- Update `CategoryTreePicker` TreeNodeRow to show a colored left border and background tint when a parent has **some but not all** children selected (indeterminate state)
- Use a dot/dash indicator icon for indeterminate parents (currently data-state is set but not visually styled)
- Add a small "X of Y selected" badge on parent nodes that have partial selection
- Use accent color highlight on fully-selected branches vs muted highlight on partial

---

## 2. Product Catalog Page (new: `/products`)

A searchable, filterable browser for **raw Syrve products** (distinct from the Wine Catalog which is enriched data).

### Route & Navigation
- Add route `/products` in `App.tsx`
- Add "Products" nav item in `AppSidebar` under a new "Catalog" group (alongside existing Wine Catalog)
- Create `src/pages/ProductCatalog.tsx`

### Features
- **Dual view**: Cards + Table (toggle like Wine Catalog)
- **Search**: by name, SKU, code
- **Filters**: product_type, category (with tree picker), stock status, price range
- **Table columns**: Name, SKU, Code, Category, Type, Sale Price, Purchase Price, Stock, Unit Capacity, Barcodes count, Synced At
- **Column management**: Reuse `ColumnManager` component with new `productColumns` in columnStore
- **Card view**: Show product name, category badge, price, stock level, type badge
- **Click through** to Product Detail page

### Data Hook
- Extend existing `useSyrveProducts` or create `useProducts` with category join, pagination support, and filter params

---

## 3. Categories Page (new: `/categories`)

### Route & Navigation
- Add route `/categories` in `App.tsx`
- Add "Categories" nav item in sidebar under Catalog group
- Create `src/pages/CategoriesPage.tsx`

### Features
- **Tree view** (reuse/adapt `CategoryTreePicker` logic) showing full hierarchy
- **Product counts** per category (with badge)
- **Expand/collapse** all
- **Search** categories by name
- **Click category** to filter Product Catalog page (navigate to `/products?category={id}`)
- **Delete category** (admin only) -- soft delete with confirmation
- **Breadcrumb trail** when drilling into subcategories

---

## 4. Product Detail Page (new: `/products/:id`)

### Route
- Add route in `App.tsx`
- Create `src/pages/ProductDetail.tsx`

### Layout (tabs or sections)
- **Overview**: Name, SKU, code, description, product type, category path, unit info
- **Pricing**: Sale price, purchase price, default sale price, price updated timestamp
- **Stock**: Current stock level, stock updated timestamp, linked store
- **Barcodes**: List of associated barcodes from `product_barcodes` table (container name, source, primary flag)
- **Syrve Raw Data**: Collapsible JSON viewer showing `syrve_data` and `metadata`
- **Linked Wine**: If auto-create is enabled, show link to Wine Catalog entry

### Data Hooks
- `useProduct(id)` -- fetch single product with category join
- `useProductBarcodes(productId)` -- fetch from `product_barcodes`

---

## 5. Inventorisation Page Enhancements

### 5a. Active Session Guard
- Before showing the scanner, check if there is an active (`in_progress`) inventory session in the DB
- If no active session exists, show a "No active inventorisation" message with disabled scan button
- The "Start Count" flow creates the session, which then enables scanning
- Other users joining the count must select the active session (not create a new one)

### 5b. Inventory Count Flow Improvements
- **CountSetup**: Add location picker (from `locations` table), show active session warning if one exists
- **Join existing session**: If an `in_progress` session exists, show option to join it instead of creating new
- **Session status check**: Poll session status during scanning -- if manager ends session remotely, show notification and stop scanning
- **Counting unit awareness**: Read `inventory_counting_unit` setting to show bottles/litres/both in QuantityPopup

### 5c. Desktop Scanner Visibility
- Read new setting `inventory_hide_scanner_desktop` (see section 7)
- On desktop (`useIsMobile() === false`), if setting is true, hide the "Start Count" nav item and redirect `/count` to dashboard
- The CameraScanner component already works on desktop but the setting allows hiding it

---

## 6. Persist Column/Filter Preferences to Database

### Current State
- `columnStore` uses Zustand with no persistence -- preferences are lost on refresh

### Changes
- Add `persist` middleware to `columnStore` using `localStorage` first (immediate improvement)
- Optionally store in `app_settings` table with key `user_column_preferences_{userId}` for cross-device sync (future enhancement -- localStorage is sufficient for now)

### What Gets Persisted
- `stockColumns`, `catalogColumns`, `historyColumns`, `sessionColumns` (+ new `productColumns`, `categoryColumns`)
- `stockFilters`, `historyFilters`, `catalogFilters`
- `columnWidths`
- Column order (already part of the arrays)

---

## 7. Settings: Hide Scanning on Desktop

### Changes to `InventorySettings.tsx`
- Add new toggle: "Hide scanner on desktop"
- Description: "Hide the barcode/AI scanner interface on desktop browsers. Scanning will only be available on mobile devices."
- Setting key: `inventory_hide_scanner_desktop`
- Default: `false`

### Implementation
- Read setting in `AppSidebar` and `MobileBottomNav` to conditionally hide "Start Count" on desktop
- In `InventoryCount.tsx`, check setting + `useIsMobile()` -- if desktop and hidden, show a message: "Scanning is available on mobile devices only"

---

## Technical Details

### New Files
- `src/pages/ProductCatalog.tsx` -- Product browser with table/card views
- `src/pages/ProductDetail.tsx` -- Single product detail page
- `src/pages/CategoriesPage.tsx` -- Category tree browser
- `src/hooks/useProducts.ts` -- Product data hooks (single, list, barcodes)

### Modified Files
- `src/App.tsx` -- Add 3 new routes
- `src/components/AppSidebar.tsx` -- Add Products, Categories nav items
- `src/components/MobileBottomNav.tsx` -- Update nav structure
- `src/components/syrve/CategoryTreePicker.tsx` -- Add delete, partial selection visuals, summary bar
- `src/stores/columnStore.ts` -- Add product/category columns, add zustand persist middleware
- `src/pages/InventoryCount.tsx` -- Active session guard, desktop scanner check, join session flow
- `src/pages/InventorySettings.tsx` -- Add "hide scanner on desktop" toggle
- `src/components/count/CountSetup.tsx` -- Active session detection, join option

### Column Store Persistence
```typescript
import { persist } from 'zustand/middleware';

export const useColumnStore = create(
  persist<ColumnStoreState>(
    (set) => ({ /* existing state */ }),
    { name: 'column-preferences' }
  )
);
```

### New Product Columns for Store
```
productColumns: ['name', 'sku', 'category', 'type', 'sale_price', 'purchase_price', 'stock', 'unit_capacity']
```

### Active Session Query
```typescript
// Check for in_progress sessions
const { data: activeSession } = useQuery({
  queryKey: ['active_inventory_session'],
  queryFn: async () => {
    const { data } = await supabase
      .from('inventory_sessions')
      .select('*')
      .eq('status', 'in_progress')
      .limit(1)
      .maybeSingle();
    return data;
  },
  refetchInterval: 10000, // Poll every 10s
});
```

