

# Fix: Prices/Stock Sync, Auto-Create Wine, and Desktop Scanner Visibility

## Issues Identified

### 1. Prices Not Captured (0 items parsed)
The `syncPrices` function parses `<productDto>` tags, but the actual Syrve response wraps items differently: `<productDtoes><productDto>...</productDto></productDtoes>`. The XML contains product metadata but **no `<price>` tag** -- only `<productType>`, `<cookingPlaceType>`, etc. The `/products` XML endpoint on this particular Syrve server does not return pricing data.

**Solution**: Use the OLAP STOCK report endpoint which is documented and reliable:
- `GET /reports/olap?report=STOCK&groupRow=Product.Num&groupRow=Product.Name&agr=Amount&from={date}&to={date}`
- This returns product balances (stock) with amounts
- For prices: use `GET /reports/olap?report=SALES&groupRow=DishCode&agr=DishSumInt&from={date}&to={date}` to get average sale prices, OR use the incoming inventory check endpoint (`POST /documents/check/incomingInventory`) which returns `expectedSum` per product

Alternatively, the simplest reliable approach:
- **Prices**: Extract `defaultSalePrice` from the JSON `/v2/entities/products/list` endpoint (already fetched during product import). Currently this value is stored but often zero. Supplement with the OLAP SALES report.
- **Stock**: Use the OLAP STOCK report: `GET /reports/olap?report=STOCK&groupRow=Product.Num&agr=FinalBalance.Amount&from={today}&to={today}&store={storeId}` which returns final balances per product.

### 2. Stock Returns 404
The URL `/reports/balance/stores` doesn't exist on this server. The correct approach is the OLAP report endpoint described above.

### 3. "Start Count" Not Hidden on Desktop
The `AppSidebar` and `MobileBottomNav` don't read the `inventory_hide_scanner_desktop` setting. The "Start Count" nav item is always visible. Also the Dashboard has a "Start Count" quick action that isn't hidden.

### 4. Auto-Create Wine Entries Requires Category Mapping
The toggle `auto_create_wines` blindly creates wine entries for all products. Instead, it should only create wines for products in specific categories selected by the user (e.g., "Wines" category group).

---

## Changes

### 1. Fix `syrve-sync` Edge Function -- Prices & Stock

**File**: `supabase/functions/syrve-sync/index.ts`

**syncPrices()** -- Rewrite to:
- Instead of fetching a separate endpoint, extract `defaultSalePrice` from the already-fetched product data (stored in `syrve_raw_objects`)
- Query all raw product objects and update `products.sale_price` and `products.default_sale_price` from `payload.defaultSalePrice` where it's > 0
- This avoids an extra API call and works reliably since the JSON list always includes `defaultSalePrice`

**syncStock()** -- Rewrite to use OLAP STOCK report:
- Call `GET /reports/olap?key={token}&report=STOCK&groupRow=Product.Num&groupRow=Product.Name&agr=FinalBalance.Amount&from={today}&to={today}&store={storeId}`
- Parse the XML response to extract product numbers and their final balance amounts
- Match products by `sku` (Product.Num) since OLAP reports use product numbers, not UUIDs
- Update `products.current_stock` for matched products

### 2. Fix "Start Count" Visibility

**File**: `src/components/AppSidebar.tsx`
- Import `useAppSetting` and `useIsMobile`
- Read `inventory_hide_scanner_desktop` setting
- Filter out "Start Count" nav item when on desktop and setting is true

**File**: `src/components/MobileBottomNav.tsx`
- No changes needed (mobile-only component, scanner should always be visible on mobile)

**File**: `src/pages/Dashboard.tsx`
- Read `inventory_hide_scanner_desktop` setting
- Hide the "Start Count" quick action card when on desktop and setting is true

### 3. Replace Auto-Create Wine Toggle with Category-Based Wine Mapping

**File**: `src/pages/SyrveSettings.tsx`
- Remove the simple `auto_create_wines` toggle
- Replace with a "Wine Category Mapping" section:
  - A category picker (reusing `CategoryTreePicker`) that lets the user select which Syrve categories contain wines
  - Store the selection in `field_mapping.wine_category_ids` (array of category UUIDs)
  - Label: "Wine Categories -- Products in these categories will be auto-linked to the Wine Catalog"
- When syncing, only products whose `category_id` is in `wine_category_ids` will have wine entries created

**File**: `supabase/functions/syrve-sync/index.ts`
- After product import, if `fieldMapping.wine_category_ids` is a non-empty array, auto-create wine entries for products in those categories (future implementation -- for now just store the mapping)

---

## Technical Details

### OLAP Stock Report URL Format
```text
GET /resto/api/reports/olap?key={token}&report=STOCK&groupRow=Product.Num&groupRow=Product.Name&agr=FinalBalance.Amount&from={DD.MM.YYYY}&to={DD.MM.YYYY}&store={storeId}
```

Note: OLAP dates use `DD.MM.YYYY` format, not ISO.

### XML Response Parsing for OLAP
The OLAP report returns XML with a table structure. Each row contains grouped fields and aggregated values. The parser will extract `Product.Num` and `FinalBalance.Amount` pairs.

### Sidebar Filter Logic
```typescript
// In AppSidebar navGroups filter
const hideScannerDesktop = useAppSetting('inventory_hide_scanner_desktop', false);
const isMobile = useIsMobile();

// Filter "Start Count" when desktop + setting enabled
const shouldHideScanner = !isMobile && hideScannerDesktop.data === true;
// Then filter items: items.filter(i => !(shouldHideScanner && i.path === '/count'))
```

### Files Modified
- `supabase/functions/syrve-sync/index.ts` -- Fix syncPrices (use stored data) and syncStock (use OLAP report)
- `src/components/AppSidebar.tsx` -- Hide "Start Count" on desktop when setting enabled
- `src/pages/Dashboard.tsx` -- Hide "Start Count" action when setting enabled on desktop
- `src/pages/SyrveSettings.tsx` -- Replace auto_create_wines toggle with wine category mapping picker

