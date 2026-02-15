

# UI/UX Modernization -- Platform-Wide Upgrade

## Overview

This plan covers a comprehensive UI/UX modernization across the entire Parra platform: an enhanced Dashboard, improved Settings health cards, modernized DataTable with pagination and row density, better filter UX, and polished visual consistency throughout.

---

## 1. Dashboard Overhaul

**Current state:** 4 stat cards + 3 quick action buttons. Minimal, no recent activity or trends.

**New design:**

- **Welcome header** with greeting, current date, and a subtle "last login" indicator
- **Stat cards** redesigned with micro-sparkline trends (using recharts already installed), subtle gradient backgrounds, and percentage change indicators (e.g., "+12% vs last count")
- **Recent Activity feed**: Last 5 inventory sessions with status badges, timestamps, and user avatars (queried from `inventory_sessions` + `profiles`)
- **Syrve Status widget**: Connection status, last sync time, product count -- compact inline card
- **Quick Actions** redesigned as icon-prominent action cards with descriptions instead of flat buttons
- **Low Stock Alert list**: Top 5 low-stock products with stock level bars (only for admin)

### Data sources (all existing)
- `useProducts()` for stock stats
- `useInventorySessions()` for recent activity
- `useSyrveConfig()` + `useSyrveSyncRuns()` for sync status
- `profiles` table for user count

---

## 2. Settings Home -- Fix Status Cards vs Buttons Problem

**Current problem:** The health status cards at the top of `/settings` look identical to the navigation cards below them. No visual hierarchy.

**Fix:**
- **Health cards**: Redesign as horizontal "status bar" with colored left border indicators (green/red/yellow), no card shadow, inline layout. Use distinct background tinting per status (success = green tint, error = red tint, neutral = muted).
- **Alert banners**: Keep but style as proper alert components with left color strip
- **Navigation grid cards**: Add subtle right-arrow indicator, larger icon with colored background, hover lift effect. Clear visual distinction from status indicators above.

---

## 3. DataTable Modernization

**Current state:** Basic table with sorting, column resize, sticky first column. No pagination, no row count display, no density toggle.

**Upgrades:**

- **Pagination**: Add configurable rows-per-page (10/25/50/100) with page navigation controls at the bottom
- **Row density toggle**: Compact / Default / Comfortable modes (affects padding and font size)
- **Row count indicator**: "Showing 1-25 of 347 products" at bottom-left
- **Striped rows option**: Alternate row backgrounds for readability
- **Empty state improvement**: Illustrated empty states with action suggestions
- **Header improvements**: Better visual separation, subtle background color for header row
- **Selection support**: Optional checkbox column for bulk operations (already partially exists in ProductCatalog)

### Files affected
- `src/components/DataTable.tsx` -- add pagination, density, row count
- `src/pages/ProductCatalog.tsx` -- integrate new DataTable features
- `src/pages/CurrentStock.tsx` -- integrate new DataTable features

---

## 4. Filter & Search UX Improvements

**Current state:** Filters hidden behind a toggle button. MultiSelectFilter uses popover checkboxes.

**Upgrades:**

- **Persistent search bar**: Always visible, with keyboard shortcut hint (Cmd+K style)
- **Active filter pills**: Show active filters as dismissible pills below the search bar (always visible when active, no need to open filter panel)
- **Filter panel**: When opened, use a cleaner grid layout with labeled sections
- **Quick filter presets**: "Low Stock", "Out of Stock", "Recently Synced" as one-click pills above the table
- **Clear all filters** button always visible when any filter is active

### Files affected
- `src/components/MultiSelectFilter.tsx` -- visual polish
- `src/components/FilterManager.tsx` -- layout improvements
- New: `src/components/ActiveFilterPills.tsx` -- shows active filters as dismissible badges
- New: `src/components/QuickFilterBar.tsx` -- preset filter buttons

---

## 5. Global Visual Polish

### Typography & Spacing
- Consistent page header pattern: `h1` + subtitle + optional action buttons, all pages
- Section dividers using subtle borders instead of relying on spacing alone
- Card border radius consistency (all `rounded-xl`)

### Color & Theme
- Replace remaining `wine-*` class references in components with semantic aliases (already started)
- Improve dark mode contrast: ensure all text on tinted backgrounds is readable
- Status colors: Standardize green/amber/red across all badges and indicators

### Component-level improvements
- **Badges**: Consistent sizing and padding across `SessionStatusBadge`, `TypeBadge`, `StockStatusBadge`, `VarianceBadge`
- **Cards**: Consistent padding (p-5 or p-6), consistent header pattern
- **Buttons**: Ensure all icon+text buttons have consistent gap and sizing
- **Loading states**: Replace "Loading..." text with proper Skeleton patterns everywhere
- **Empty states**: Consistent pattern with icon + title + description + optional CTA

### Sidebar
- Active item: stronger visual indicator (filled background instead of just border-left)
- Group labels: slightly larger, better spacing
- User section: cleaner avatar with online indicator dot

---

## 6. Page-Specific Improvements

### Product Catalog
- Card view: Add subtle hover animation, image placeholder with product initial
- Table view: Integrate pagination and density controls
- Add "Export CSV" button in toolbar

### Inventarisation Check (CurrentStock)
- Tab design: Use underline-style tabs instead of pill tabs for cleaner look
- Inventory tab: Add summary row at bottom of table (totals)
- Check Review tab: Session cards with better visual hierarchy, progress indicators
- Start Count tab: Larger, more prominent CTA with visual illustration

### Sync Management (SyrveSyncPage)
- Timeline-style sync history instead of flat list
- Better visual distinction between running/completed/failed syncs
- Progress bar for active syncs

### Reports page
- Better "coming soon" placeholder with illustration

---

## Technical Details

### Files to create
| File | Purpose |
|------|---------|
| `src/components/ActiveFilterPills.tsx` | Dismissible active filter badges |
| `src/components/QuickFilterBar.tsx` | Preset filter buttons (Low Stock, etc.) |
| `src/components/PageHeader.tsx` | Consistent page header component |
| `src/components/EmptyState.tsx` | Reusable empty state with icon + text + CTA |
| `src/components/StatusIndicator.tsx` | Reusable status dot/badge for settings health cards |

### Files to modify
| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Complete redesign with activity feed, status widget, sparklines |
| `src/pages/AppSettings.tsx` | Redesign health cards as status bar, improve nav card hierarchy |
| `src/components/DataTable.tsx` | Add pagination, density toggle, row count, header styling |
| `src/pages/ProductCatalog.tsx` | Integrate new DataTable features, active filter pills |
| `src/pages/CurrentStock.tsx` | Integrate new DataTable features, tab styling |
| `src/components/MultiSelectFilter.tsx` | Visual polish, better mobile UX |
| `src/components/FilterManager.tsx` | Cleaner layout |
| `src/components/AppSidebar.tsx` | Active state styling, group spacing |
| `src/components/CollapsibleSection.tsx` | Subtle visual polish |
| `src/index.css` | New utility classes, animation keyframes, status color tokens |
| `src/pages/SyrveSyncPage.tsx` | Timeline history, better stat cards |
| `src/pages/Reports.tsx` | Better placeholder design |

### Dependencies
- No new dependencies needed. Uses existing `recharts` for sparklines, existing shadcn components for all UI.

### Approach
Changes will be implemented incrementally:
1. Shared components first (PageHeader, EmptyState, StatusIndicator, ActiveFilterPills)
2. DataTable pagination and density
3. Dashboard redesign
4. Settings page hierarchy fix
5. Filter UX improvements across pages
6. Global visual polish pass

