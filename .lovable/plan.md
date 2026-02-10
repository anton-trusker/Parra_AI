

## Inventory and Wine Details Improvements

This plan covers 6 areas of improvement across the inventory table, wine detail page, wine form, and location management.

---

### 1. Add "Total in Litres" Column to Inventory Table

Add a new column `totalLitres` to the stock table that calculates total volume correctly:
- **Unopened bottles**: count as full volume (e.g., 10 x 0.75L = 7.5L)
- **Opened bottles**: should NOT count as full -- they will be counted based on the amount remaining (stored as a decimal fraction or litre value in `stockOpened`)

Update `mockWines` data model: change `stockOpened` from integer count to a decimal representing the remaining volume in litres (or fraction of bottles). For example, if 2 bottles are open with ~0.3 each remaining, `stockOpened` would be `0.6`.

In `CurrentStock.tsx`:
- Add `totalLitres` to `STOCK_COLUMN_DEFS`
- Add a new column in `buildColumns()` that computes: `(wine.stockUnopened * wine.volume / 1000) + wine.stockOpened * wine.volume / 1000` (adjusted for partial bottles)
- Display as e.g. "7.95L"

### 2. Add "Total in Litres" to Wine Detail Page

In `WineDetail.tsx`, inside the Stock section:
- Add a row showing "Total (Litres)" calculated using the same logic as above
- Display below the existing Total count

### 3. Add Change History/Logs Tab to Wine Detail Page

Convert the wine detail page to use tabs:
- **Details** tab: contains all current content (origin, grapes, stock, pricing, tasting notes, etc.)
- **History** tab: shows a full audit log of changes for this wine

The History tab will:
- Query `audit_logs` and `inventory_movements` tables filtered by `entity_id = wine.id`
- Display a timeline of changes: stock adjustments, field edits, price changes, etc.
- Each entry shows: timestamp, user, action description, old/new values
- For now with mock data, extend `mockMovements` to show as the history entries

### 4. Make SKU Optional

In `WineForm.tsx`:
- Remove the asterisk/required validation for SKU (currently `handleSave` only checks `name` and `producer`, so SKU is already optional in validation)
- In the `Wine` interface in `mockWines.ts`: change `sku: string` to `sku?: string` (make it optional)
- Update all renders that display SKU to handle undefined: show "---" or empty

### 5. Glass Amount Selection When "Available by Glass" is Toggled

In `WineForm.tsx`, when the user toggles "Available by Glass" on:
- Show a dropdown/selector for glass pour size, populated from `glassDimensions` in the settings store
- The selected glass dimension determines the pour volume
- Add a `glassPourSize` field to the form state
- This links to the existing `glass_pour_size_ml` column in the database

### 6. Improve Location Flexibility

Currently locations are typed as `cellar | bar | storage`. The user wants more freedom -- a location could be another store, warehouse, partner venue, etc.

Changes:
- In `GeneralSettings.tsx`: replace the fixed "Type" dropdown (`cellar/bar/storage`) with a free-text input, or add more types like `store`, `warehouse`, `partner`, `other`
- Update `LocationConfig` type in `referenceData.ts` to accept any string for `type` instead of a fixed union
- Update `settingsStore.ts` accordingly
- In the wine form, replace the rigid `Cellar Section / Rack / Shelf` fields with a location picker that uses the hierarchical locations from settings (parent location + sub-location dropdown)

---

### Technical Details

**Files to modify:**
- `src/data/mockWines.ts` -- make `sku` optional, adjust `stockOpened` typing
- `src/pages/CurrentStock.tsx` -- add `totalLitres` column definition
- `src/pages/WineDetail.tsx` -- add tabs (Details/History), add total litres to stock section
- `src/pages/WineForm.tsx` -- glass dimension picker on by-glass toggle, location picker from settings, ensure SKU not required
- `src/pages/GeneralSettings.tsx` -- free-text location type input
- `src/data/referenceData.ts` -- update `LocationConfig.type` to `string`
- `src/stores/settingsStore.ts` -- no structural changes needed (already string-compatible)
- `src/components/DataTable.tsx` -- no changes needed

**New dependencies:** None required. Uses existing Tabs component from `@radix-ui/react-tabs`.

