

# CSV Inventory Import Feature

## Overview
Add a complete CSV import workflow for inventory, accessible to admins. Users can download a pre-formatted CSV template, fill it with their wine inventory data, upload the CSV, map their columns to the system's fields, preview and validate the data, then confirm the import.

## User Flow

1. **Entry Point** -- New "Import CSV" button on the Wine Catalog page (visible to admins only)
2. **Step 1: Upload** -- Upload screen with a "Download Template" button and a drag-and-drop / file picker for CSV upload
3. **Step 2: Column Mapping** -- Interactive mapping screen showing detected CSV headers on the left and system fields on the right via dropdowns; auto-maps matching names
4. **Step 3: Preview & Validate** -- Data preview table showing parsed rows with validation errors highlighted (missing required fields, invalid types, etc.)
5. **Step 4: Confirm & Import** -- Summary of how many wines will be imported, then confirm to store them

## What Gets Built

### New Page: `src/pages/ImportInventory.tsx`
Multi-step wizard with 4 steps (Upload, Map, Preview, Confirm). Uses local state to hold the parsed CSV data, column mappings, and validation results. On confirm, adds wines to the mock data store (ready for future DB integration).

### New Utility: `src/utils/csvParser.ts`
- `parseCSV(file: File)` -- Parses a CSV file into headers + rows using native browser APIs (no external library needed)
- `generateTemplate()` -- Creates and triggers download of a CSV template with all mappable columns
- `validateRow(row, mappings)` -- Validates a single mapped row and returns errors per field
- Column definitions for mapping targets (name, producer, vintage, type, region, country, volume, price, purchasePrice, sku, barcode, stockUnopened, stockOpened, minStockLevel, location, grapeVarieties, abv, etc.)

### Route Addition
- Add `/catalog/import` route in `App.tsx`

### Catalog Page Update
- Add "Import CSV" button next to "Add Wine" on the Wine Catalog page (admin only)

## Technical Details

### CSV Template Columns
The downloadable template will include these columns with example data in row 2:
`Name, Producer, Vintage, Type, Region, Country, Volume (ml), ABV, SKU, Barcode, Price, Purchase Price, Stock Unopened, Stock Opened, Min Stock Level, Location, Grape Varieties`

### Column Mapping Logic
- Auto-detect: fuzzy match CSV headers to system fields (e.g., "wine name" maps to "Name", "qty" maps to "Stock Unopened")
- Manual override: each CSV column gets a dropdown to select the target system field or "Skip"
- Required fields highlighted: Name, Type, and SKU are required

### Validation Rules
- **Name**: required, non-empty string
- **Type**: must be one of Red, White, Rose, Sparkling, Fortified, Dessert
- **Vintage**: optional, must be a valid year (1900-2026) or empty for NV
- **Volume**: must be a positive number (defaults to 750 if empty)
- **Price / Stock fields**: must be non-negative numbers
- **Grape Varieties**: comma-separated string, split into array
- Duplicate SKU detection within the file and against existing inventory

### Step UI Details

**Step 1 - Upload**
- Drag-and-drop zone with file icon
- "Download Template" button
- File type restricted to .csv
- Shows file name and row count after parsing

**Step 2 - Column Mapping**
- Two-column layout: CSV header on left, system field dropdown on right
- Green checkmark for mapped columns, yellow warning for unmapped required fields
- "Auto-detect" button to re-run fuzzy matching
- Preview of first 3 rows of data for each column

**Step 3 - Preview**
- Scrollable data table showing mapped data
- Red-highlighted cells for validation errors
- Error summary banner: "3 rows have errors -- fix or skip"
- Toggle to show only rows with errors

**Step 4 - Confirm**
- Summary card: X wines to import, Y warnings, Z will be skipped
- "Import All" button
- On success: toast notification + redirect to catalog

### State Management
All import state is local to the ImportInventory page (useState) -- no new store needed since this is a one-time operation. On successful import, wines are added to a new Zustand wine store (or appended to mock data for now).

