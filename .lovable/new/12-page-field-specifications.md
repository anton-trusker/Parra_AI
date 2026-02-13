# 12 — Page & Field Specifications

## 1. Product Catalog / Inventory View
The central hub for viewing and searching products.

### 1.1 Filter Bar
- **Search**: Fuzzy search on `name` and `sku`.
- **Category Filter**: Multi-select dropdown synced from `categories` table.
- **Stock Status**: Filter by `In Stock`, `Low Stock`, `Out of Stock`.
- **Dynamic Filters**: User can add filters based on any column (Price, Unit, Last Synced).

### 1.2 Product List (Table/Grid)
- **Image**: Display `image_url` or category-specific placeholder.
- **Name**: Product name (primary sort).
- **SKU**: Displayed small below name.
- **Category Badge**: Color-coded by category type.
- **Stock Level**: Progress bar or numeric value with status color.
- **Price**: Retail price (optional display).

---

## 2. Product Passport (Detail View)
Comprehensive information for a single product.

### 2.1 General Information (Syrve-Driven)
- **Product Name**: Editable (syncs back to Syrve if permitted).
- **SKU / ID**: Read-only from Syrve.
- **Category**: Dropdown to re-categorize (local only or sync).
- **Base Unit**: (e.g., Bottle, Liter, KG).
- **Unit Capacity**: (e.g., 0.75 for a bottle).

### 2.2 Enrichment (Metadata JSONB)
- **Alcohol %**: Numeric input.
- **Country/Region**: Dropdown (Standardized Country Component).
- **Producer**: Text input.
- **Vintage**: Numeric (for wine/spirits).
- **Description**: Textarea (supports AI auto-generation).

### 2.3 Inventory Settings
- **Par Level**: Minimum stock threshold.
- **Is Countable**: Toggle to include/exclude from inventory sessions.
- **Default Location**: Primary storage location.

---

## 3. Inventory Counting (Mobile UI)
Optimized for fast, native-feel data entry.

### 3.1 Scanner Interface
- **Full-Screen Camera**: High-speed barcode detection.
- **AI Recognition Button**: Trigger Gemini if barcode fails.
- **Flash Toggle**: For dark cellars.

### 3.2 Quantity Popup (Sheet/Drawer)
- **Quick Add**: Buttons for +1, +6, +12.
- **Unit Selector**: Toggle between Full Units and Partial (Opened).
- **Partial Entry**:
  - For liquids: Visual slider or numeric entry based on `glass_dimensions`.
  - For weighted items: Numeric entry in grams/kg.
- **Location Selector**: Native-style selection list.
- **Note Field**: Quick text/voice-to-text input.

---

## 4. Admin Configuration (Settings)

### 4.1 Syrve Integration
- **Server URL**: Validated text input.
- **Login/Password**: Secured fields.
- **Test Connection**: Button triggering `syrve-auth`.
- **Store Selection**: Dropdown populated after successful test.
- **Approval Workflow**: Toggle (Require manager approval before sync).

### 4.2 Business Identity
- **Business Name**: Global display name.
- **Logo Upload**: Supabase Storage integration.
- **AI Key Management**:
  - Toggle: "Use System Key" vs "Use My Key".
  - API Key Input: Password-masked field.

### 4.3 Units & Dimensions
- **Glass Sizes**: CRUD table for defining standard pours (150ml, 50ml, etc.).
- **Category Defaults**: Mapping table (e.g., "White Wine" -> "150ml Glass").
- **Language/Currency**: Global localization settings.


