

# Syrve Integration Flow Redesign

## Summary

Redesign the Syrve Settings page to support two distinct user journeys: **Initial Setup** (new connection) and **Ongoing Management** (existing connection). The initial setup auto-imports all reference data on successful connection test, then guides the user through configuration before the first product import. The ongoing management view shows current sync status and provides quick actions.

---

## Flow 1: New Connection (First-Time Setup)

### Step-by-step user experience:

1. **Credentials** -- User enters Server URL, Login, Password and clicks "Test Connection"
2. **Auto-import on success** -- On successful test, automatically fetch and store ALL reference data:
   - Departments (business locations) via `/corporation/departments`
   - Warehouses/Stores via `/corporation/stores`
   - Product Groups (categories hierarchy) via `/v2/entities/products/group/list`
   - Measurement Units via `/v2/entities/list?rootType=MeasureUnit`
   - Business info extraction (already exists)
3. **Configure Warehouses** -- User selects which warehouses to integrate (multi-select with "Select All")
4. **Configure Categories** -- Show full category tree (auto-refreshed based on warehouse selection). User picks which to import. Hierarchical picker with select/deselect branches.
5. **Import Rules** -- Product types to import, reimport mode. Sync Schedule section is hidden for new setup.
6. **"Save & Import"** button -- Saves config AND triggers a bootstrap sync. Shows real-time progress.
7. **Import behavior** -- Only imports products matching: selected warehouses + selected product types + selected categories. Products without a category ARE still imported.

### What changes on the backend (`syrve-connect-test`):

- After successful auth, also fetch categories via `/v2/entities/products/group/list` and save to DB (currently only done during sync)
- Return categories count in the response so the UI can immediately show the category picker

### What changes on the UI (`SyrveSettings.tsx`):

- Restructure into a wizard-like flow for new connections:
  - After test succeeds: auto-expand Warehouses section, show category picker populated from freshly imported data
  - Hide "Sync Schedule" section during initial setup
  - Replace "Save All Settings" + "Sync Now" with a single "Save & Import" button
  - Show import progress inline

---

## Flow 2: Existing Connection (Ongoing Management)

### User experience:

1. **Dashboard view** -- Shows current connection status, last sync time, and summary cards:
   - Warehouses: X selected out of Y
   - Categories: X selected
   - Products: X imported
   - Stock: last updated at...
2. **Quick Actions**:
   - "Re-sync Products, Prices & Stock" -- Runs a sync that imports/updates all changes from Syrve for current selection. New products in selected stores are auto-imported.
   - "Refresh Prices & Stock Only" -- Quick update without re-importing product catalog
3. **Edit Configuration** -- Expandable sections to modify warehouses, categories, import rules
4. **Behavior on config change + sync** -- If user changes categories/warehouses and clicks sync, perform full replacement: delete products not matching new selection, import all matching products fresh

---

## Technical Changes

### 1. Edge Function: `syrve-connect-test`

- Add category fetching (same logic as `syncCategories` in `syrve-sync`) during connection test
- Save categories to DB immediately so the picker works before first sync
- Return `categories_count` in response

### 2. Edge Function: `syrve-sync`

- Add "Select All" warehouse support: if no specific stores selected, sync all stores
- Ensure products without a category (`parentGroupId` is null/empty) are still imported when category filtering is active
- When reimport mode triggers after config changes, properly handle the full replacement flow

### 3. Frontend: `SyrveSettings.tsx` -- Major Restructure

**New connection flow:**
- After successful test: show a "Setting up..." state while reference data loads
- Auto-open warehouse selection populated from test results
- Category picker populated from freshly-imported categories
- Single "Save & Import" call-to-action at the bottom
- Inline progress display

**Existing connection flow:**
- Compact summary dashboard at the top showing key metrics
- "Re-sync" and "Refresh Prices & Stock" buttons prominently placed
- Collapsible sections for editing configuration
- When config is changed, the sync button changes to "Save & Re-import" to signal full replacement

**Select All for warehouses:**
- Add a "Select All / Deselect All" toggle above the warehouse list

### 4. Category Picker Enhancement

- Ensure categories refresh when warehouse selection changes (already partially implemented)
- Show both standard groups and custom categories in the tree
- Products without category note: add info text "Products without a category will also be imported"

### 5. Product Import Logic Fix

In `syncProducts` within `syrve-sync`:
- Currently skips products where `parentGroupId` is not in `selectedSyrveIds`
- Change: if `selectedSyrveIds` is set but product has NO `parentGroupId` (null/empty), still import it
- This ensures uncategorized products are always included

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/syrve-connect-test/index.ts` | Add category import on connection test |
| `supabase/functions/syrve-sync/index.ts` | Fix uncategorized product import, improve reimport logic |
| `src/pages/SyrveSettings.tsx` | Major UI restructure: wizard for new, dashboard for existing |
| `src/hooks/useSyrve.ts` | Minor: add query for last sync run stats |

No database schema changes needed -- all required tables already exist.

