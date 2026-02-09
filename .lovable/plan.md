

# Settings UI Overhaul, Inventory Restructure, Filter Config, and Session Review

## Overview

This plan covers five major areas: improving all settings pages with collapsible sections, renaming "Current Stock" to "Inventory" and embedding the count button, adding configurable filter preferences, expanding table columns, and building a proper session review/approval workflow with history storage.

---

## 1. Rename "Current Stock" to "Inventory" and Move Count Button

### Navigation Changes
- In `AppSidebar.tsx` and `MobileBottomNav.tsx`: rename the "Current Stock" / "Stock" label to "Inventory" (keep path `/stock` or change to `/inventory`)
- Remove the "Inventory Count" nav item from sidebar and bottom nav entirely
- Route `/count` remains functional but is no longer a top-level nav entry

### Inventory Page Header
- In `CurrentStock.tsx` (renamed conceptually to Inventory):
  - Change heading from "Current Stock" to "Inventory"
  - Add a "Start Count" button (wine-gradient style) to the left of the Export button in the header actions row
  - Clicking "Start Count" navigates to `/count`

---

## 2. Settings Pages -- Collapsible Sections with Improved UI

### General Settings (`GeneralSettings.tsx`)
- Wrap each section (Opened Bottle Measurement, Glass Dimensions, Locations, Bottle Volumes) in a collapsible component using Radix Collapsible
- Each section header becomes a clickable trigger with a chevron icon that rotates on expand/collapse
- Default state: all sections collapsed (or first one open)
- Add a subtle count badge on each collapsed header (e.g., "6 items")
- Add save confirmation toasts on all add/remove actions (already present, keep consistent)

### Roles & Permissions (`RolesPermissions.tsx`)
- Make each role card collapsible -- header shows role name, color dot, and permission summary (e.g., "7 modules configured")
- Collapsed by default except when only 1-2 roles exist
- Improve the permission grid styling: add alternating row backgrounds, hover states
- Add a "Save" indicator or auto-save toast when permissions change

### App Settings Hub (`AppSettings.tsx`)
- Keep the card-based layout but add subtle hover animations
- Add a "User Management" link card pointing to `/users`

---

## 3. Configurable Filter Preferences

### Filter Configuration Store
- Add to `columnStore.ts` (or a new `filterStore.ts`):
  - `stockFilters: string[]` -- which filter controls are visible (e.g., `['status', 'type', 'country', 'region', 'location', 'stockRange']`)
  - `historyFilters: string[]`
  - Setter functions for each

### Filter Config UI
- Add a gear icon button next to the filter/sliders button on the Inventory and History pages
- Clicking it opens a popover (similar to ColumnManager) where the user can toggle which filters appear in the advanced filters panel
- Available filter options for Inventory: Status, Type, Country, Region, Location, Stock Range, Vintage, Price Range, Appellation, Producer
- Available filter options for History: Method, Date Range, User, Session, Wine Type

### Implementation
- Create a `FilterManager` component (similar pattern to `ColumnManager`) that accepts a list of possible filters and which are active
- In `CurrentStock.tsx` and `InventoryHistory.tsx`, only render filters that are in the active list

---

## 4. Expanded Table Columns

### Add More Column Options
- **Inventory (Stock) table** -- add columns matching Wine detail fields:
  - `producer`, `appellation`, `subRegion`, `abv`, `grapeVarieties`, `purchasePrice`, `salePrice`, `glassPrice`, `supplier`, `barcode`, `sku`, `body`, `sweetness`, `closureType`, `bottleSize`
- **History table** -- add: `notes`, `location`
- **Catalog table** -- add: `region`, `abv`, `barcode`, `location`, `grapeVarieties`, `body`

### Update Column Definitions
- Update `STOCK_COLUMNS` array in `CurrentStock.tsx` with all new column definitions
- Update `HISTORY_COLUMNS` in `InventoryHistory.tsx`
- Update `CATALOG_COLUMNS` in `WineCatalog.tsx`
- Render new columns conditionally in the table based on `columnStore`

---

## 5. Session Review and Approval (Admin)

### Enhanced Session Review Page (`SessionReview.tsx`)
- Add more filters: date range, session type, created by user, variance threshold
- Add column management (reuse ColumnManager)
- Present sessions as a proper table view (not just expandable cards) with an option to expand for detail
- Add summary stats at the top: total sessions, pending review count, approved count, flagged count

### Approval Workflow
- When admin clicks "Approve": update the session's status in mock data to `approved`, record `approvedBy` and `approvedAt`
- When admin clicks "Flag": show a dialog to enter a reason, update status to `flagged`
- Store approved/flagged state in a Zustand store (`sessionStore.ts`) so changes persist during the session

### History and Audit Trail
- Create a `sessionStore.ts` that holds a copy of sessions and items with mutation support:
  - `approveSession(id, notes)` -- sets status to approved, records timestamp and admin
  - `flagSession(id, reason)` -- sets status to flagged with reason
  - `getSessionHistory(id)` -- returns all items and audit entries for a session
- Each approval/flag action creates an audit entry with timestamp, user, action, and notes
- Display audit trail in the expanded session view (below the items table)

---

## Technical Details

### Files to Create
- `src/components/FilterManager.tsx` -- filter configuration popover (mirrors ColumnManager pattern)
- `src/stores/sessionStore.ts` -- session state management with approval/flag/audit actions

### Files to Modify
- `src/pages/CurrentStock.tsx` -- rename header, add Start Count button, add FilterManager, add new column definitions and rendering
- `src/pages/GeneralSettings.tsx` -- wrap all sections in collapsible components with improved styling
- `src/pages/RolesPermissions.tsx` -- make role cards collapsible, improve grid styling
- `src/pages/AppSettings.tsx` -- add User Management card, polish hover states
- `src/pages/SessionReview.tsx` -- add filters, column management, summary stats, approval workflow with audit trail
- `src/pages/InventoryHistory.tsx` -- add FilterManager, new column options
- `src/pages/WineCatalog.tsx` -- add new column options
- `src/components/AppSidebar.tsx` -- rename "Current Stock" to "Inventory", remove "Inventory Count" nav item
- `src/components/MobileBottomNav.tsx` -- rename "Stock" to "Inventory", remove "Count" from primary nav (replace with another item or keep 3 primary)
- `src/stores/columnStore.ts` -- add filter preference arrays, expand default column lists
- `src/data/referenceData.ts` -- update module label from "Current Stock" to "Inventory"

### Component Pattern for Collapsible Sections
Each settings section will use this pattern:
- Clickable header row with icon, title, item count badge, and animated chevron
- Content area that smoothly expands/collapses using Radix Collapsible
- Consistent spacing and card styling across all settings pages

