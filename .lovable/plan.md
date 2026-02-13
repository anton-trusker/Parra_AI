

# Admin Settings & Syrve Data Improvements

## Overview
Enhance admin settings with new inventory mode toggles and improve how Syrve department/product data is parsed, stored, and displayed. When an admin connects to Syrve, the department XML contains business profile data (legal name, address, taxpayer ID, country, city) that should auto-populate Business Settings.

---

## 1. Auto-populate Business Settings from Syrve Department Data

**Problem**: The `syrve-connect-test` edge function parses departments using the same basic `parseStoresXml` which only extracts `id`, `name`, `code`, `type`. The XML contains rich legal entity data (`jurPersonAdditionalPropertiesDto`) with address, taxpayer ID, registration number, etc.

**Solution**:
- Enhance `syrve-connect-test/index.ts` to parse the full department XML including:
  - `taxpayerIdNumber` from DEPARTMENT type
  - `jurPersonAdditionalPropertiesDto` from JURPERSON type: `taxpayerId`, `address`, `registrationNumber`, `legalAddressDto` (zipCode, country, region, city, street, house)
- Return parsed `business_info` in the response
- In `SyrveSettings.tsx`, after successful connection test, offer a "Import Business Info" button that saves parsed department data to `app_settings` (business_name, legal_name, business_address, business_country, business_city, taxpayer_id)

## 2. Parse Product Containers During Sync

**Problem**: Products have `<container>` blocks with volume data (`count` = capacity in litres, `name` = btl/btl 1.5) but the current `syrve-sync` only parses simple XML fields and skips nested container data.

**Solution**:
- Update `parseXmlItems` in `syrve-sync/index.ts` to also parse `<container>` blocks (similar to how `<barcodeContainer>` is parsed)
- Store container data in the product's `syrve_data` jsonb and extract `unit_capacity` from the first container's `count` field
- Save `productCategory` and `cookingPlaceType` into the product's `metadata` jsonb

## 3. New Inventory Settings Toggles

Add the following controls to `InventorySettings.tsx`:

| Setting Key | Type | Default | Description |
|---|---|---|---|
| `inventory_barcode_scanner_enabled` | boolean | true | Enable/disable barcode scanning mode |
| `inventory_ai_scanner_enabled` | boolean | true | Enable/disable AI label recognition mode |
| `inventory_counting_unit` | enum | "bottles" | Count in bottles or litres |
| `inventory_track_opened_bottles` | boolean | true | Track opened bottles separately |
| `inventory_allow_manual_search` | boolean | true | Allow manual product search during counting |
| `inventory_require_location` | boolean | true | Require location assignment for each count |
| `inventory_allow_negative_stock` | boolean | false | Allow negative stock values |

**UI structure** -- new collapsible section "Counting Methods" with:
- Barcode Scanner toggle
- AI Recognition toggle  
- Manual Search toggle
- Counting unit selector (Bottles / Litres / Both)
- Track opened bottles toggle

And in "Session Rules" add:
- Require location assignment toggle
- Allow negative stock toggle

## 4. Improved Inventory Rules

Enhance the existing Inventory Settings with:

- **Baseline source selector**: "Syrve" (default) or "Last session" -- stored as `inventory_baseline_source`
- **Auto-close stale sessions**: Add `inventory_auto_close_days` (number, default 0 = disabled) to auto-close sessions older than N days
- **Recount policy**: `inventory_allow_recount` (boolean) -- allow recounting the same item in one session
- **Dual-unit display**: `inventory_show_litres_equivalent` (boolean, default true) -- show litre equivalent alongside bottle count

## 5. Frontend Display of Syrve Product Data

Ensure `SyrveSyncPage.tsx` stats properly reflect:
- Products by `mainUnit` breakdown (btl vs gls vs л)
- Products with containers vs without
- Show `productCategory` distribution

Add a simple breakdown card below the existing stats showing unit type distribution.

---

## Technical Details

### Files to modify:
1. **`supabase/functions/syrve-connect-test/index.ts`** -- Add `parseDepartmentDetails()` function to extract legal entity data from XML
2. **`supabase/functions/syrve-sync/index.ts`** -- Update `parseXmlItems()` to parse `<container>` blocks; save `productCategory`, `cookingPlaceType` to metadata; extract `unit_capacity` from containers
3. **`src/pages/InventorySettings.tsx`** -- Add new toggles for counting methods, baseline source, recount policy, dual-unit display
4. **`src/pages/SyrveSettings.tsx`** -- Add "Import Business Info" button after connection test, auto-fill business settings from department data
5. **`src/pages/SyrveSyncPage.tsx`** -- Add unit type breakdown card

### No database migrations needed
All new settings use the existing `app_settings` key-value table. Container data goes into the existing `syrve_data` jsonb and `metadata` jsonb columns on `products`.

