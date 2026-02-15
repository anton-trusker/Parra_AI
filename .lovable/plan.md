

# Frontend Restructure -- Document-Driven Implementation

This plan restructures the entire frontend to match the uploaded Frontend Structure Guide, adding new pages, reorganizing navigation, and populating everything with mock data for a complete working UI.

---

## What Changes

### Navigation Restructure

**Current sidebar:**
- Dashboard
- Inventory > Inventarisation Check
- Syrve Data > Products, Categories
- History & Logs
- Reports (coming soon)
- Suppliers / Orders (coming soon)
- Settings

**New sidebar (per document):**
- Dashboard
- Inventory (section)
  - Products
  - Categories
  - By Store
  - Inventory Checks
  - AI Scans
- Reports (coming soon)
- Orders (coming soon)
- Settings

**Top Bar** (new): Add a global top bar inside AppLayout with:
- Tenant/location switcher placeholder (dropdown, future)
- Date range selector placeholder
- Global search (Cmd+K style trigger)

**Mobile bottom nav** updated to match: Home, Products, Checks, Scans, More

---

### New Pages to Create

| Page | Route | Description |
|------|-------|-------------|
| By Store | `/inventory/by-store` | Store-focused inventory view with store selector and product table filtered per store |
| Inventory Checks | `/inventory/checks` | List of all inventory check sessions with status, filters, and "New check" button |
| Inventory Check Detail | `/inventory/checks/:id` | Detailed check view with Counting tab, Review/Variances tab, and Activity Log tab |
| AI Scans | `/inventory/ai-scans` | History table of AI recognition operations with confidence, product linking |
| Orders | `/orders` | Coming soon placeholder with tabs structure |

### Existing Pages to Modify

| Page | Changes |
|------|---------|
| **Dashboard** | Add Inventory Health block (variance summary, top 5 shortages/surpluses), AI Activity Monitor (7/30 day counts, avg confidence), Integration Status tiles (Syrve + future placeholders), improve Quick Actions |
| **Products** (`/products`) | Add grouping mode selector (Flat, By Category, Goods-to-Dishes, By Store, Hierarchy), row actions menu (view, edit, AI scan, exclude), bulk actions bar, saved views concept |
| **Product Detail** | Restructure into tabs: Overview, Images & AI, Integrations, History. Add mock data for AI recognition results and stock history timeline |
| **Categories** | Add right panel with category details: Products tab (table of products in category) and Mappings tab (future placeholder). Support drag-to-reorder (visual only) |
| **CurrentStock** | Rename/repurpose -- this page's inventory tab content moves to the new Inventory Checks flow. The current "Inventarisation Check" becomes the Checks list page |
| **Settings** | Add Billing & Usage card (subscription tier, AI usage). Add Telegram/AI Assistant card (future placeholder) |
| **Reports** | Add Orders tab placeholder in addition to existing report cards |

---

### Mock Data

All new pages will use local mock data (no database changes):

```text
mockStores.ts        -- 3 stores with IDs, names, addresses
mockInventoryChecks.ts -- 8 checks with various statuses (draft, in_progress, pending_review, approved, synced)
mockAiScans.ts       -- 15 AI scan records with timestamps, products, confidence levels
mockCheckItems.ts    -- 30 items per check with expected/counted/variance
mockStockByStore.ts  -- Products with per-store stock levels
mockActivityLog.ts   -- 20 activity entries for check detail
```

---

### Product Page Grouping Modes

The Products page gets a view mode selector with 5 options:

1. **Flat List** -- current table (default)
2. **By Category** -- collapsible category headers with aggregate rows, products nested under each
3. **Goods to Dishes** -- parent goods rows expand to show child dish/prepared items that consume them (mock parent-child relationships)
4. **By Store** -- store header rows with per-store stock columns
5. **Hierarchy Tree** -- nested tree combining category + subcategory (similar to current Categories page but inline)

Each mode renders a different table layout component but shares the same filter/search bar.

---

### Product Detail Tabs

Restructured into 4 tabs:

- **Overview**: Basic info, pricing, current stock per store (mini table with mock per-store data)
- **Images & AI**: Image gallery placeholder, last AI recognition results (mock: product name, category, quantity, confidence), "Run AI Recognition" button
- **Integrations**: Syrve mapping info (external ID, last sync, raw payload snippet -- already exists)
- **History**: Stock level changes timeline (mock entries), inventory check participation list, AI operations log

---

### Inventory Checks List Page

New page at `/inventory/checks`:

- Top bar: "New inventory check" button, filters (store, status, date range)
- Table columns: Title, Store, Status, Created by, Started at, Completed at, Approved by
- Row actions: Open details, Duplicate, Cancel, Send to Syrve
- Status badges: draft, in_progress, pending_review, approved, synced (color-coded)

---

### Inventory Check Detail Page

New page at `/inventory/checks/:id`:

Header section with title, store, status, dates, action buttons (Start/Resume, Complete, Approve, Reject, Send to Syrve -- visibility based on status and role).

Three tabs:
1. **Counting**: Search/scan mode + table mode toggle. Search box for product lookup, quick-add controls per row (unopened units, open quantity), counting method badge
2. **Review & Variances**: Manager-only expected vs counted table with variance highlighting, filters for "only variances" and "only shortages"
3. **Activity Log**: Chronological feed of count events, status changes, AI scans, manager adjustments

---

### AI Scans Page

New page at `/inventory/ai-scans`:

- Filters: date range, store, confidence threshold, operation type
- Table: Timestamp, Product (linked), Detected name, Quantity, Confidence %, Status (confirmed/pending/rejected), User, Image thumbnail
- Click to expand: shows full AI response details, image preview, product match suggestions

---

### By Store Page

New page at `/inventory/by-store`:

- Top: store selector (cards or dropdown showing 3 mock stores)
- When store selected: product table filtered to that store with store-specific stock column, last counted date
- "All stores" toggle: shows all products grouped by store headers with per-store aggregates

---

### Orders Page (Coming Soon)

New page at `/orders`:

- Disabled tabs: Live Orders, Historical Orders, Sales by Product
- Placeholder explaining Syrve order sync is planned
- Future filter hints: date, store, order type, channel

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/data/mockStores.ts` | 3 store objects with name, address, product counts |
| `src/data/mockInventoryChecks.ts` | 8 inventory check sessions |
| `src/data/mockAiScans.ts` | 15 AI scan records |
| `src/data/mockCheckDetail.ts` | Check items, activity log entries |
| `src/data/mockStockByStore.ts` | Per-store stock data |
| `src/pages/ByStorePage.tsx` | Store-focused inventory view |
| `src/pages/InventoryChecksPage.tsx` | Checks list page |
| `src/pages/InventoryCheckDetail.tsx` | Single check detail with 3 tabs |
| `src/pages/AiScansPage.tsx` | AI scans history |
| `src/pages/OrdersPage.tsx` | Coming soon placeholder |
| `src/components/TopBar.tsx` | Global top bar with tenant switcher, search |
| `src/components/ProductGroupedView.tsx` | Grouped table views (by category, goods-to-dishes, by store) |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add new routes: `/inventory/by-store`, `/inventory/checks`, `/inventory/checks/:id`, `/inventory/ai-scans`, `/orders` |
| `src/components/AppLayout.tsx` | Add TopBar component above Outlet |
| `src/components/AppSidebar.tsx` | Restructure nav groups to match document hierarchy |
| `src/components/MobileBottomNav.tsx` | Update primary items to Home, Products, Checks, Scans |
| `src/pages/Dashboard.tsx` | Add Inventory Health block, AI Activity Monitor, Integration Status tiles |
| `src/pages/ProductCatalog.tsx` | Add grouping mode selector, row actions dropdown, bulk actions |
| `src/pages/ProductDetail.tsx` | Restructure into 4 tabs with mock AI and history data |
| `src/pages/CategoriesPage.tsx` | Add right panel with products tab and mappings tab |
| `src/pages/AppSettings.tsx` | Add Billing & Usage and Telegram cards |
| `src/pages/Reports.tsx` | Polish with coming soon structure |
| `src/pages/CurrentStock.tsx` | Route redirect -- "Inventarisation Check" becomes `/inventory/checks` |

### Routes Map

| Route | Component |
|-------|-----------|
| `/dashboard` | Dashboard |
| `/products` | ProductCatalog |
| `/products/:id` | ProductDetail |
| `/categories` | CategoriesPage |
| `/inventory/by-store` | ByStorePage |
| `/inventory/checks` | InventoryChecksPage |
| `/inventory/checks/:id` | InventoryCheckDetail |
| `/inventory/ai-scans` | AiScansPage |
| `/count` | InventoryCount (scanning flow, launched from check detail) |
| `/orders` | OrdersPage |
| `/reports` | Reports |
| `/settings` | AppSettings |
| `/settings/*` | (unchanged) |
| `/users` | UserManagement |
| `/history` | InventoryHistory |

### Dependencies
No new packages needed. Everything uses existing shadcn components, recharts, and lucide icons.

### Implementation Order
1. Mock data files (all 5)
2. TopBar component
3. Navigation restructure (sidebar + mobile nav + routes)
4. New pages (ByStore, InventoryChecks, InventoryCheckDetail, AiScans, Orders)
5. Dashboard enhancements
6. ProductCatalog grouping modes
7. ProductDetail tabs restructure
8. CategoriesPage right panel
9. Settings additions

