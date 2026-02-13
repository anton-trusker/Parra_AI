

## Plan: Fix Wine Inventory + Rebuild Inventarisation Check Page

### Problems Identified

1. **Wine Inventory shows no data**: The `wines` table RLS SELECT policy is set to `authenticated` role only. The user's preview session appears unauthenticated (requests use only the anon key). The actual fix: ensure the user is logged in. However, we should also verify the query works correctly -- the data (1,063 wines) exists in the database and the hook/query code is correct.

2. **Current Stock page uses mock data**: `CurrentStock.tsx` imports from `mockWines` instead of querying the database.

3. **Navigation restructuring needed**: Rename "Current Stock" to "Inventarisation Check", merge "Session Review" as a tab inside it, consolidate all inventory functionality.

---

### Changes

#### 1. Fix Wine Inventory Data Display

- The RLS policy `Auth can read wines` uses `USING (true)` but is scoped to the `authenticated` role. This is correct -- the user simply needs to be logged in. We will verify the user is redirected to login if not authenticated (this is already handled by `AuthProvider`).
- No code change needed for the data query itself -- it correctly queries `wines` where `is_active=true` and `is_archived=false`.
- **Potential fix**: If the issue persists, we may need to check `AuthProvider` to ensure the session token is properly attached to requests.

#### 2. Replace Current Stock Mock Data with Real Database Queries

- Rewrite `CurrentStock.tsx` to use `useWines()` hook (real Supabase data) instead of `mockWines`.
- All columns, filters, sorting will work against real wine data from the database.

#### 3. Rename and Restructure to "Inventarisation Check"

- Rename "Current Stock" to **"Inventarisation Check"** in sidebar and mobile nav.
- Change the page title and description accordingly.
- The page becomes the central hub for inventory management.

#### 4. Add Tabs: "Inventory" + "Check Review" + "Start Count"

The Inventarisation Check page will have 3 tabs:

- **Inventory Tab** (default): Shows all wines with current stock levels from the database. Includes configurable columns, filters, search. Role-based: staff cannot see expected stock values.
- **Check Review Tab**: Embeds the current `SessionReview` functionality (session list, diff tables, approve/flag workflow, per-user breakdown). Replaces the standalone `/sessions` route.
- **Start Count Tab**: Embeds the current `CountSetup` / scanning flow, allowing users to start or join inventory sessions directly from this page.

#### 5. Sidebar Updates

- Remove standalone "Session Review" from sidebar (merged into Inventarisation Check).
- Remove standalone "Start Count" from sidebar (merged into Inventarisation Check).
- Rename "Current Stock" to "Inventarisation Check".
- Keep route as `/stock` for the combined page.

#### 6. Route Cleanup

- `/sessions` route: Redirect to `/stock` (or remove).
- `/count` route: Keep as standalone for mobile deep-linking but also accessible via tab.

---

### Technical Details

#### Files to Modify

| File | Change |
|------|--------|
| `src/pages/CurrentStock.tsx` | Complete rewrite: replace mock data with `useWines()`, add Tabs (Inventory, Check Review, Start Count), embed SessionReview and CountSetup components |
| `src/components/AppSidebar.tsx` | Rename "Current Stock" to "Inventarisation Check", remove "Session Review" and "Start Count" entries |
| `src/components/MobileBottomNav.tsx` | Update label for stock tab |
| `src/App.tsx` | Keep `/stock` route pointing to updated page, optionally redirect `/sessions` to `/stock` |

#### Data Flow

- Wine data: `useWines()` hook queries `wines` table with filters
- Session data: `useInventorySessions()` hook queries `inventory_sessions` table
- Count events: `useCountEvents()` / `useProductAggregates()` for diff tables
- Role checks: `useUserRole()` for hiding stock from staff during counting

#### Column Definitions for Inventory Tab

Reuse the existing `CATALOG_COLUMN_DEFS` pattern from `WineCatalog.tsx` but adapted for stock context:
- Wine, Producer, Vintage, Type, Volume, Country, Region, Stock (Closed/Open/Total), Total Litres, Par Level, Status, Value, Location, etc.
- All columns configurable via `ColumnManager`
- Dynamic filters from visible columns via `FilterManager`

#### Role-Based Visibility

- Staff/Viewer: Cannot see "Expected" stock, "Variance" columns, or pricing data
- Manager/Admin/Super Admin: Full visibility including variance, expected stock, approve/flag controls

