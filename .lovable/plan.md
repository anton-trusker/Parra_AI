

# Platform-Wide UI/UX Improvement + Store Integration Fix

## Context

The user identified two key issues:
1. **Syrve "Store" = Warehouse/Location** -- The "By Store" page currently uses hardcoded mock stores with fake addresses/cities. In Syrve, a "Store" is actually a warehouse/storage location (e.g., "Bar storage", "Kitchen storage", "Boa Hora storage"). The real `stores` table in the database already has this data. The By Store page, store selectors, and mock data all need to use real DB stores instead of fake mock data.
2. **UI/UX quality is poor** -- Filters feel clunky, tables lack polish, pages have inconsistent spacing, cards blend together, and the overall platform feels unfinished. A comprehensive visual polish pass is needed.

---

## 1. Replace Mock Stores with Real Database Stores

### Problem
- `mockStores.ts` has fake stores ("Main Restaurant", "Wine Bar Downtown", "Beach Club Cascais") with addresses/cities
- Real `stores` table has actual Syrve warehouses: "Bar storage", "Kitchen storage", "Boa Hora storage", etc.
- The TopBar, CountSetup, ByStorePage, InventoryChecksPage, AiScansPage, and Dashboard all reference mock stores

### Solution
- Create a `useStores()` hook that fetches from the real `stores` table
- Replace all `mockStores` imports with the real hook
- Update the `MockStore` interface to match the real `stores` table shape (no address/city, add syrve_store_id, store_type, code)
- Update `ByStorePage` to use real stores and real products (join products with stores via stock data, or show all products per store)
- Update `TopBar` store selector to use real stores
- Update `CountSetup` store selector to use real stores
- Keep `mockStockByStore.ts` for per-store stock breakdown (since per-store stock isn't in the DB yet), but map it to real store IDs where possible

### Files
- **Create**: `src/hooks/useStores.ts`
- **Modify**: `src/components/TopBar.tsx`, `src/components/count/CountSetup.tsx`, `src/pages/ByStorePage.tsx`, `src/pages/Dashboard.tsx`
- **Delete**: `src/data/mockStores.ts` (or repurpose as fallback)

---

## 2. By Store Page Redesign

### Current problems
- Uses fake stores with addresses
- Empty state is just an icon and text with no visual interest
- Product table after selecting a store is basic SimpleDataTable with no search/filter
- No aggregate overview before selecting a store

### Improvements
- Use real stores from DB
- Show store cards with: name, store type badge, product count, total stock, last sync time, active/inactive indicator
- Add search bar to filter products within selected store
- Add category filter pills within store view
- Show "All Stores" comparison mode: table with one column per store showing stock levels
- Better empty state with EmptyState component
- Add store stats summary row at top (total stores, total products, total stock)

---

## 3. Filter & Search UX Overhaul

### Current problems
- MultiSelectFilter popover is functional but visually cramped
- Filter panel toggle is hidden behind a button with no visual cue that filters exist
- Active filter pills exist but are small and easy to miss
- No quick-filter presets for common operations

### Improvements across all pages

**Search bar**:
- Larger, more prominent with subtle glass effect background
- Always visible on every page that has data
- Placeholder text more descriptive per context

**Filter triggers**:
- Replace generic "Filters" button with inline filter chips that show available filter types
- When no filters active: show filter type labels as outline pills (e.g., "Type", "Category", "Stock")
- When filter active: pill becomes filled with count badge
- Clicking pill opens the MultiSelectFilter popover directly

**MultiSelectFilter improvements**:
- Wider popover (280px instead of 224px)
- Better checkbox alignment and spacing
- Show option count next to each option (e.g., "GOODS (42)")
- Add "Select All" / "Clear" footer actions
- Smooth max-height transition

**Active filter pills**:
- More prominent styling with colored background matching filter type
- Larger touch targets for mobile
- "Clear all" button always visible when filters active

**Quick filter presets** (on Product Catalog):
- "Low Stock", "Out of Stock", "No Price", "Inactive" as one-click toggle pills above the table
- These are pre-configured filter shortcuts

### Files modified
- `src/components/MultiSelectFilter.tsx`
- `src/pages/ProductCatalog.tsx`
- `src/pages/InventoryChecksPage.tsx`
- `src/pages/AiScansPage.tsx`
- `src/pages/ByStorePage.tsx`

---

## 4. DataTable & SimpleDataTable Visual Polish

### Current problems
- Table headers are plain and lack hierarchy
- Row hover states are too subtle
- Pagination controls are functional but cramped
- No visual density options
- SimpleDataTable lacks pagination entirely

### Improvements

**DataTable**:
- Header row: stronger background color, more padding, better border separation
- Row hover: more visible highlight
- Alternating rows: slightly more contrast
- Pagination bar: cleaner layout with better spacing
- Add row count text: "Showing 1-25 of 347"

**SimpleDataTable**:
- Add optional pagination support (reuse pagination logic)
- Better empty state integration
- Row hover improvements
- Header styling consistency with DataTable

### Files modified
- `src/components/DataTable.tsx`
- `src/components/SimpleDataTable.tsx`

---

## 5. Dashboard Visual Improvements

### Current problems
- Cards are visually flat and blend together
- Quick action cards could use more visual weight
- Spacing between sections inconsistent
- Welcome header has no visual anchor

### Improvements
- Add subtle gradient or border accent to stat cards
- Quick action "Start Count" card: larger, more prominent with gradient background
- Card sections: add section headers with subtle dividers
- Store list: use real stores from DB
- Better spacing rhythm (consistent gap-6 between major sections)

### Files modified
- `src/pages/Dashboard.tsx`

---

## 6. Sidebar & Navigation Polish

### Current problems
- Active state indicator could be stronger
- Group labels are small and easy to miss
- Collapsible sections lack visual feedback
- Mobile menu transition feels basic

### Improvements
- Active nav item: add left border accent + filled background
- Group labels: slightly larger with more top spacing
- Hover states: smoother transitions
- User section: cleaner layout with role badge
- "Count Now" quick-action item with accent styling in Inventory group

### Files modified
- `src/components/AppSidebar.tsx`

---

## 7. Session Pages Polish

### Inventory Checks List
- Improve filter bar layout: search + filters in a single cohesive row
- Store filter should use real stores from DB
- Better table row styling with hover states
- Status badges: more consistent sizing

### Inventory Check Detail
- Summary cards: add subtle accent borders matching status
- Timeline: improve step connector lines
- Counting tab: better inline editing affordance
- Variances tab: color-code entire row background for high variances

### Count Setup
- Store selector: use real stores from DB
- Better visual grouping with card sections
- Improve radio group styling for baseline config

### Files modified
- `src/pages/InventoryChecksPage.tsx`
- `src/pages/InventoryCheckDetail.tsx`
- `src/components/count/CountSetup.tsx`

---

## 8. Categories Page Polish

### Current problems
- Tree view rows are visually thin
- Context menu items lack visual hierarchy
- Edit dialog is functional but plain
- No visual distinction between active/inactive categories

### Improvements
- Tree rows: slightly more height, better indentation guides
- Inactive categories: dimmed text + "Inactive" mini badge
- Edit dialog: add active/inactive toggle switch, better layout with form fields
- Context menu: icon alignment, separator before delete
- Category count badge: more readable sizing

### Files modified
- `src/pages/CategoriesPage.tsx`

---

## 9. Global CSS & Theme Improvements

### Improvements
- Refine card hover states globally
- Better focus-visible rings across all interactive elements
- Improve dark mode contrast for status colors
- Standardize animation timing (all transitions 200ms)
- Add subtle box-shadow to cards on hover
- Clean up any remaining `wine-glass-effect` references

### Files modified
- `src/index.css`

---

## Technical Details

### New files
| File | Purpose |
|------|---------|
| `src/hooks/useStores.ts` | Hook to fetch real stores from Supabase `stores` table |

### Modified files (summary)
| File | Key Changes |
|------|-------------|
| `src/hooks/useStores.ts` | New hook for real store data |
| `src/components/TopBar.tsx` | Use real stores |
| `src/components/count/CountSetup.tsx` | Use real stores |
| `src/pages/ByStorePage.tsx` | Complete redesign with real stores, search, filters |
| `src/pages/Dashboard.tsx` | Real stores, visual polish |
| `src/pages/ProductCatalog.tsx` | Inline filter chips, quick presets, polish |
| `src/pages/InventoryChecksPage.tsx` | Real stores in filters, table polish |
| `src/pages/InventoryCheckDetail.tsx` | Visual polish, variance row highlighting |
| `src/pages/AiScansPage.tsx` | Real stores in filters, search bar |
| `src/pages/CategoriesPage.tsx` | Tree row polish, inactive indicators |
| `src/components/MultiSelectFilter.tsx` | Wider, better spacing, option counts |
| `src/components/DataTable.tsx` | Header styling, row hover, pagination polish |
| `src/components/SimpleDataTable.tsx` | Optional pagination, styling consistency |
| `src/components/AppSidebar.tsx` | Active state, Count Now item, spacing |
| `src/index.css` | Global polish, animation refinement |

### Dependencies
No new packages needed.

### Implementation order
1. `useStores` hook + store integration across all pages
2. By Store page redesign
3. MultiSelectFilter + filter UX improvements
4. DataTable/SimpleDataTable polish
5. Dashboard visual improvements
6. Sidebar navigation polish
7. Session pages polish
8. Categories polish
9. Global CSS refinements

