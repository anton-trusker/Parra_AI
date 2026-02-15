

# Frontend Enhancement -- Document-Driven UI Improvements

This plan implements the detailed functionality described in the Frontend Architecture Specification across all existing pages, focusing on interactive features, improved tables, filters, tabs, and settings -- without blindly following wireframe layouts where the current design is already better.

---

## Overview of Changes

The document describes detailed functionality that goes beyond what's currently implemented. This plan adds missing interactive features, richer data displays, and improved UX flows while keeping the existing modern visual design.

---

## 1. Dashboard Enhancements

**Current state:** Welcome header, 4 stat cards, quick actions, inventory health, AI monitor, low stock alerts, integration status, stores, recent activity.

**Additions from spec:**
- **Active Sessions Table**: Add a dedicated card showing active inventory sessions with status badges, progress bars, and "Join Counting" / "Review" action buttons (per doc section 5.5)
- **Role-based KPI cards**: Swap stat card content based on user role (Staff sees "Your Counts Today" and "AI Scans Used"; Manager sees "Pending Approvals" and "Variance This Week"; Owner sees "Inventory Turnover" and "Total Variance %")
- **Variance Trend Chart**: Add a small line chart (recharts) showing weekly variance percentage trend in the Inventory Health card
- **Quick Actions**: Add "Create New Session" (manager+) and "Search Products" cards alongside existing ones

### Files modified
- `src/pages/Dashboard.tsx`

---

## 2. Inventory Module -- Sessions & Counting

### 2.1 Inventory Checks Page (Sessions List)

**Current state:** Table with status filter, store filter, and action dropdown.

**Additions from spec (section 6.2):**
- Add **date range filter** (date picker)
- Add **search bar** for session titles
- Add **progress bar** column showing percentage complete
- Add **"Created by" avatar** with initials
- Improve action buttons per status: Draft=[Start][Edit][Delete], In Progress=[Join Counting][View], Pending Review=[Review][View], Approved=[View][Export]
- Add **"+ New Session"** button in header (links to create session flow, manager+ only)
- Add empty state with illustration and "Create New Session" CTA

### Files modified
- `src/pages/InventoryChecksPage.tsx`
- `src/data/mockInventoryChecks.ts` (add progress percentage field)

### 2.2 Create Session Flow

**Current state:** Simple CountSetup with count type dropdown and notes field.

**Improvements from spec (section 6.3):** The current "Start Count" page needs enhancement, but keeping our own cleaner design rather than following the wireframe exactly:
- Add **Session Title** text input (auto-generated default like "Weekly Inventory - Feb 15")
- Add **Store selector** dropdown (from mock stores)
- Add **Baseline Configuration** section: radio group for "Use current Syrve stock" / "Use last session" / "Manual"
- Add **Category filter**: Optional multi-select to limit which categories to count
- Add **Counting Settings** checkboxes: Allow barcode, Allow AI, Show expected stock to counters, Require approval
- Rename button from "Start New Session" to "Create Session" (creates as draft) with secondary "Create & Start" (creates and immediately starts)
- Keep current "Join Active Session" card

### Files modified
- `src/components/count/CountSetup.tsx`
- `src/pages/InventoryCount.tsx`

### 2.3 Session Detail Page (Check Detail)

**Current state:** 3 tabs (Counting, Review & Variances, Activity Log) with basic tables.

**Additions from spec (section 6.4):**
- **Overview Tab** (new, first tab): Summary cards (Total Products, Counted, Remaining, Variances Detected), progress chart, active counters list, action buttons based on status
- **Counting Tab**: Add quick filter pills (All, Not Counted, Counted, by Category), add count method badges, improve product list with "Enter quantity" inline action
- **Variances Tab**: Add variance summary cards (Surplus total, Shortage total, Net variance), add variance flag colors (High >10% red, Medium 5-10% orange, Low <5% green), add row actions (View Details, Add Note, Recount, Accept)
- **History Tab**: Add visual timeline at top showing session lifecycle, improve event feed with event type icons and better formatting

### Files modified
- `src/pages/InventoryCheckDetail.tsx`
- `src/data/mockCheckDetail.ts` (add variance value data, more activity entries)

---

## 3. Products Module

### 3.1 Products Page

**Current state:** Search, filters panel, column manager, card/table view toggle.

**Additions from spec (section 7.2-7.5):**
- **View Mode Selector**: Add tabs/pills for "All | By Category | By Store | By Type" (per doc section 7.2). Currently only flat + card views exist
- **By Category view**: Collapsible tree table with category headers, product count per category, expand/collapse all buttons
- **By Type view**: Group products by type (Goods/Dish/Modifier/Service) with expandable "Used in" / "Ingredients" relationships (mock data)
- **By Store view**: Group by store with per-store stock columns
- **Bulk Actions Bar**: When rows are selected via checkboxes, show floating action bar with "Export", "Change Category", "Activate/Deactivate" options
- **Row Actions Menu**: Add context menu per row (Edit, Duplicate, View History, Delete)
- **Active Filter Pills**: Show selected filters as dismissible pills below the search bar

### Files modified
- `src/pages/ProductCatalog.tsx`
- New: `src/components/ProductGroupedView.tsx` (tree table for category/type/store views)
- `src/data/mockStockByStore.ts` (extend with more product-store mappings)

### 3.2 Product Detail

**Current state:** 4 tabs (Overview, Images & AI, Integrations, History).

**Additions from spec (section 7.6):**
- **Overview Tab**: Add "Stock" sub-section with stock level chart over time (small area chart), add "Custom Fields" section placeholder
- **Stock Tab** (rename from within Overview): Separate dedicated "Stock" tab showing current stock by location table, stock movement history, recent counts from sessions, stock level chart
- **Relationships Tab** (new): If Goods -- show dishes using this ingredient. If Dish -- show ingredient list. Mock data for parent-child relationships
- Keep existing History tab, add more detail to timeline entries

### Files modified
- `src/pages/ProductDetail.tsx`

---

## 4. Categories Module

**Current state:** Tree view with search, expand/collapse, delete. Simple hierarchy.

**Additions from spec (section 8):**
- **Dual view toggle**: Tree view (current) + flat List view (table with parent column, sortable)
- **Category Detail Modal**: Click category name opens edit dialog with name, parent, description, sort order, active toggle, product count, "View All Products" link
- **Context Menu**: Per-category (...) menu with Edit, Add Subcategory, View Products, Move to, Duplicate, Delete
- **Visual indicators**: Active/inactive status color, Syrve sync icon

### Files modified
- `src/pages/CategoriesPage.tsx`

---

## 5. Settings Module

### 5.1 Settings Home

**Current state:** Status indicators, alerts, navigation cards grid.

**Additions from spec (section 11.2):**
- Add **Billing & Subscription** card (links to placeholder billing page)
- Add **Custom Fields** card (placeholder for future feature)
- Add **Account / My Profile** card
- Reorganize cards into grouped sections matching the doc's left sidebar menu: General, Users & Access, Integrations, Inventory, Customization, Billing, Account

### Files modified
- `src/pages/AppSettings.tsx`

### 5.2 Business Settings

**Current state:** Business profile, locale, operational defaults.

**Additions from spec (section 11.3):**
- Add **Contact** fields (email, phone)
- Add **Logo Upload** placeholder area
- Remove glass size from operational defaults (already cleaned up, verify)

### Files modified
- `src/pages/BusinessSettings.tsx`

### 5.3 Inventory Settings

**Current state:** Extensive toggle-based settings in collapsible sections.

**Additions from spec (section 11.6):**
- Add **Variance Thresholds** section with separate high/medium/low percentage and value inputs (currently only has single threshold)
- Add **Collaborative Counting** toggle
- Improve layout with clearer section grouping matching the doc structure: Counting Rules, Session Defaults, Variance Thresholds, Units & Measurements

### Files modified
- `src/pages/InventorySettings.tsx`

### 5.4 New: Billing Page (Placeholder)

**From spec (section 11.7):**
- Current plan card showing tier, price, next billing date
- AI usage progress bar (scans used / limit)
- Payment method display
- Invoice history table
- All mock data, no real billing integration

### Files created
- `src/pages/BillingSettings.tsx`

---

## 6. Sidebar Navigation Update

**Current state:** Dashboard, Inventory (Products, Categories, By Store, Checks, AI Scans), Analytics, Administration.

**Changes from spec (section 4.2):**
- Under **Inventory** section: rename "Inventory Checks" to "Sessions" to match the doc's terminology
- Add **"Count Now"** quick action item under Inventory section (links to `/count`)
- Move "AI Scans" position (keep under Inventory)
- Ensure sidebar item for "Sessions" is labeled consistently

### Files modified
- `src/components/AppSidebar.tsx`

---

## 7. Reports & Orders Pages

**Current state:** Both have "coming soon" placeholders.

**Improvements from spec (sections 9, 10):**
- **Reports**: Add categorized placeholder sections (Inventory Reports, Variance Reports, AI Usage Reports, Operational Reports) with specific planned report names listed
- **Orders**: Add disabled tab structure (Live Orders, Historical Orders, Sales by Product) with description of planned features

### Files modified
- `src/pages/Reports.tsx`
- `src/pages/OrdersPage.tsx`

---

## Technical Details

### New Files
| File | Purpose |
|------|---------|
| `src/pages/BillingSettings.tsx` | Billing & subscription placeholder with mock data |
| `src/components/ProductGroupedView.tsx` | Grouped product table views (by category, type, store) |

### Modified Files
| File | Key Changes |
|------|-------------|
| `src/pages/Dashboard.tsx` | Active sessions table, role-based KPIs, variance chart |
| `src/pages/InventoryChecksPage.tsx` | Search, date filter, progress bars, improved actions |
| `src/components/count/CountSetup.tsx` | Session title, store, baseline config, category filter, counting settings |
| `src/pages/InventoryCount.tsx` | Pass new fields to session creation |
| `src/pages/InventoryCheckDetail.tsx` | Overview tab, variance summary, timeline, filter pills |
| `src/pages/ProductCatalog.tsx` | View mode selector, bulk actions, row context menu, filter pills |
| `src/pages/ProductDetail.tsx` | Stock tab, Relationships tab |
| `src/pages/CategoriesPage.tsx` | List view toggle, edit modal, context menu |
| `src/pages/AppSettings.tsx` | Grouped sections, billing/custom fields cards |
| `src/pages/BusinessSettings.tsx` | Contact fields, logo placeholder |
| `src/pages/InventorySettings.tsx` | Variance threshold tiers, collaborative counting |
| `src/pages/Reports.tsx` | Categorized planned reports |
| `src/pages/OrdersPage.tsx` | Tab structure for future features |
| `src/components/AppSidebar.tsx` | Rename "Inventory Checks" to "Sessions", add "Count Now" |
| `src/data/mockCheckDetail.ts` | Add variance values, more activity entries |
| `src/data/mockInventoryChecks.ts` | Add progress field |
| `src/App.tsx` | Add billing settings route |

### Dependencies
No new packages. Uses existing recharts, shadcn components, and lucide icons.

### Implementation Order
1. Mock data updates (checks, check detail)
2. Sidebar navigation tweak
3. Dashboard active sessions + role KPIs
4. Inventory Checks page (search, filters, progress)
5. Create Session flow (CountSetup enhancement)
6. Session Detail (Overview tab, variance summary, timeline)
7. Product Catalog (view modes, bulk actions, context menu)
8. Product Detail (Stock tab, Relationships tab)
9. Categories (list view, edit modal, context menu)
10. Settings home reorganization + Billing page
11. Business/Inventory settings additions
12. Reports + Orders polish

