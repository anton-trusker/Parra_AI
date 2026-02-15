# Settings Module — Complete Solution Document

> **Version**: 1.0  
> **Last Updated**: 2026-02-15  
> **Scope**: All administrative configuration, reference data, integrations, and user management  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Settings Home — AppSettings](#2-settings-home)
3. [Business Settings](#3-business-settings)
4. [General Settings — Reference Data](#4-general-settings)
5. [Inventory Rules](#5-inventory-rules)
6. [Syrve Integration](#6-syrve-integration)
7. [AI Recognition Settings](#7-ai-recognition-settings)
8. [Roles & Permissions](#8-roles--permissions)
9. [User Management](#9-user-management)
10. [Database Schema Reference](#10-database-schema-reference)
11. [Edge Functions Reference](#11-edge-functions-reference)
12. [React Hooks Reference](#12-react-hooks-reference)
13. [Routing & Access Control](#13-routing--access-control)
14. [Security Model](#14-security-model)
15. [Known Gaps & Future Work](#15-known-gaps--future-work)

---

## 1. Architecture Overview

### Design Philosophy

The Settings module is the **centralized source of truth** for all business logic, reference data, and administrative configuration. It follows a key-value persistence pattern for simple settings and dedicated tables for structured reference data.

### Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  React   │  │  Zustand  │  │  React   │      │
│  │  Pages   │──│  Stores   │──│  Query   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│       │                            │             │
└───────┼────────────────────────────┼─────────────┘
        │                            │
        ▼                            ▼
┌─────────────────────────────────────────────────┐
│              Supabase Client SDK                 │
│    supabase.from('table').select/insert/update   │
│    supabase.functions.invoke('edge-fn')          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│                 Supabase Backend                 │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Database     │  │  Edge Functions          │ │
│  │  (Postgres)   │  │  (Deno runtime)          │ │
│  │               │  │                          │ │
│  │  app_settings │  │  syrve-connect-test      │ │
│  │  ai_config    │  │  syrve-save-config       │ │
│  │  syrve_config │  │  syrve-sync              │ │
│  │  app_roles_   │  │  manage-users            │ │
│  │    config     │  │  ai-recognize-label      │ │
│  │  locations    │  │  ai-enrich-wine          │ │
│  │  sub_locations│  │  generate-wine-embeddings│ │
│  │  volume_      │  │  auth-login-username     │ │
│  │    options    │  │  syrve-process-outbox    │ │
│  │  glass_       │  │  syrve-stock-snapshot    │ │
│  │    dimensions │  │                          │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Row Level Security (RLS)                │   │
│  │  Admin: full CRUD on settings tables     │   │
│  │  Auth:  SELECT-only on settings tables   │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Persistence Strategy

| Data Type | Storage | Pattern |
|-----------|---------|---------|
| Simple key-value config (business profile, inventory rules) | `app_settings` table | Key-value JSONB with `useAppSetting(key, default)` hook |
| AI pipeline config | `ai_config` table | Single row with structured columns + `settings` JSONB |
| Syrve connection & import rules | `syrve_config` table | Single row with 25+ typed columns |
| Role definitions & permissions | `app_roles_config` table | One row per role, `permissions` JSONB |
| Reference data (locations, volumes, glass sizes) | Dedicated tables | Typed rows with soft-delete (`is_active`) |
| Ephemeral/legacy state (for Zustand fallback) | `settingsStore.ts` | In-memory only, NOT persisted to DB |

---

## 2. Settings Home

**File**: `src/pages/AppSettings.tsx`  
**Route**: `/settings`  
**Access**: `admin`, `super_admin` roles only

### Purpose

Central dashboard showing system health and navigation to all settings sub-modules.

### Health Status Cards

| Card | Data Source | Logic |
|------|------------|-------|
| **Syrve Connection** | `useSyrveConfig()` → `syrve_config.connection_status` | Displays "Connected ✓" (green) or "Not Connected" (red). Shows `connection_tested_at` timestamp. |
| **Last Sync** | `useSyrveSyncRuns()` → most recent `syrve_sync_runs` row | Displays relative time (e.g., "2 hours ago"), status badge (success/failed/running), and product count from `stats.products`. |
| **AI Recognition** | `useAiConfig()` → `ai_config` row | Shows active model name badge, on/off status based on `is_active` field. |
| **Active Users** | Custom query counting `profiles` where `is_active = true AND deleted_at IS NULL` | Displays total count as numeric stat. |

### Alert System

Dynamic warnings displayed above navigation grid:

```typescript
const alerts = [];
if (config?.connection_status !== 'connected') 
  alerts.push({ type: 'warning', text: 'Syrve not connected', link: '/settings/syrve' });
if (!config?.default_store_id) 
  alerts.push({ type: 'info', text: 'No default store selected', link: '/settings/syrve' });
if (productCount === 0) 
  alerts.push({ type: 'warning', text: 'No products synced yet', link: '/settings/syrve' });
```

### Navigation Grid

9 cards in responsive grid layout:

| Module | Icon | Route | Status |
|--------|------|-------|--------|
| Business Settings | Building2 | `/settings/business` | Active |
| General Settings | SlidersHorizontal | `/settings/general` | Active |
| Inventory Rules | ClipboardList | `/settings/inventory` | Active |
| Syrve Integration | Link | `/settings/syrve` | Active |
| AI Recognition | Brain | `/settings/ai` | Active |
| Roles & Permissions | Shield | `/settings/roles` | Active |
| User Management | Users | `/users` | Active |
| Database | Database | — | Future (disabled) |
| Notifications | Bell | — | Future (disabled) |

### Component Tree

```
AppSettings
├── HealthCards (4x Card components)
│   ├── SyrveStatusCard
│   ├── LastSyncCard
│   ├── AiStatusCard
│   └── ActiveUsersCard
├── AlertBanner[] (conditional)
└── NavigationGrid (9x clickable cards)
    └── Card → useNavigate(route)
```

---

## 3. Business Settings

**File**: `src/pages/BusinessSettings.tsx`  
**Route**: `/settings/business`

### Purpose

Manages organization-wide profile, locale, and operational defaults.

### Sections & Fields

#### Organization Profile

| Field | app_settings Key | Type | Default | Validation |
|-------|-----------------|------|---------|------------|
| Business Name | `business_name` | string | `''` | Required |
| Legal Name | `business_legal_name` | string | `''` | Optional |
| Address | `business_address` | string | `''` | Optional |
| Country | `business_country` | string | `''` | Optional |
| City | `business_city` | string | `''` | Optional |
| Taxpayer ID | `business_taxpayer_id` | string | `''` | Optional |

#### Locale Configuration

| Field | app_settings Key | Options | Default |
|-------|-----------------|---------|---------|
| Language | `locale_language` | English, Russian, Portuguese, Spanish, French | `'en'` |
| Currency | `locale_currency` | USD, EUR, GBP, RUB, AED, SAR, BRL, CHF, JPY, CNY | `'USD'` |
| Timezone | `locale_timezone` | UTC, Europe/Moscow, Asia/Dubai, America/New_York, +8 more | `'UTC'` |

#### Operational Defaults

| Field | app_settings Key | Type | Default |
|-------|-----------------|------|---------|
| Default Bottle Size | `default_bottle_size_ml` | number (ml) | `750` |
| Default Glass Size | `default_glass_size_ml` | number (ml) | `150` |

### Syrve Import Feature

When Syrve connection is established, a "Import from Syrve" button appears. This auto-populates:
- `business_name` ← `business_info.business_name`
- `business_legal_name` ← `business_info.legal_name`
- `business_address` ← `business_info.address`
- `business_country` ← `business_info.country`
- `business_city` ← `business_info.city`
- `business_taxpayer_id` ← `business_info.taxpayer_id`

Data source: `syrve-connect-test` edge function response → `business_info` object.

### Persistence Pattern

Each field is independently read and written using the generic `app_settings` hooks:

```typescript
// Read
const { data: businessName } = useAppSetting('business_name', '');

// Write
const updateSetting = useUpdateAppSetting();
updateSetting.mutate({ key: 'business_name', value: 'My Restaurant' });
```

The `useUpdateAppSetting` hook performs an upsert: checks if the key exists, updates if so, inserts if not.

---

## 4. General Settings — Reference Data

**File**: `src/pages/GeneralSettings.tsx`  
**Route**: `/settings/general`

### Purpose

Manages hierarchical reference data used across the application: measurement units, storage locations, and bottle volumes.

### Section 1: Opened Bottle Measurement

**app_settings Key**: `opened_bottle_unit`  
**Type**: `'fraction' | 'litres'`  
**Default**: `'fraction'`

Controls how opened/partial bottles are measured during inventory counting:
- **Fraction**: Staff selects 1/4, 1/3, 1/2, 2/3, 3/4 of a bottle
- **Litres**: Staff enters exact remaining volume in litres

UI: Radio group with two options.

### Section 2: Glass Dimensions

**Table**: `glass_dimensions`  
**Columns**: `id`, `label`, `volume_litres`, `is_active`, `created_at`

Defines available glass pour sizes for by-the-glass inventory tracking.

| Operation | Hook | SQL |
|-----------|------|-----|
| List active | `useGlassDimensions()` | `SELECT * FROM glass_dimensions WHERE is_active = true ORDER BY volume_litres` |
| Add | `useAddGlassDimension()` | `INSERT INTO glass_dimensions (label, volume_litres)` |
| Remove (soft) | `useRemoveGlassDimension()` | `UPDATE glass_dimensions SET is_active = false WHERE id = $1` |

**UI Component**:
```
┌─────────────────────────────────────────┐
│ Glass Dimensions                        │
│                                         │
│  [Standard 150ml]  [x]                 │
│  [Large 250ml]     [x]                 │
│  [Tasting 75ml]    [x]                 │
│                                         │
│  Label: [________]  Volume: [___] L    │
│  [+ Add Glass Size]                     │
└─────────────────────────────────────────┘
```

### Section 3: Storage Locations

**Tables**: `locations` + `sub_locations`

Hierarchical two-level location system for inventory organization.

#### locations table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, auto-generated |
| `name` | text | Required, e.g., "Main Bar" |
| `type` | text | Optional, e.g., "bar", "cellar", "storage" |
| `is_active` | boolean | Soft delete flag |
| `created_at` | timestamptz | Auto |

#### sub_locations table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `location_id` | UUID | FK → locations.id |
| `name` | text | Required, e.g., "Shelf A" |
| `is_active` | boolean | Soft delete flag |

**Hooks**:

```typescript
// Fetches locations WITH nested sub_locations in one query
useLocations() → LocationWithSubs[]
// Promise.all of locations + sub_locations queries, then joins client-side

useAddLocation({ name, type? })
useRemoveLocation(id) // → SET is_active = false
useAddSubLocation({ location_id, name })
useRemoveSubLocation(id) // → SET is_active = false
```

**UI**: Expandable tree with collapsible location rows. Each location shows a "+" button to add sub-locations. Trash icon on each item for soft-delete.

### Section 4: Bottle Volumes

**Table**: `volume_options`  
**Columns**: `id`, `label`, `ml`, `bottle_size`, `is_active`

Defines the set of available bottle volumes used in wine forms and inventory.

| Operation | Hook | SQL |
|-----------|------|-----|
| List active | `useVolumes()` | `SELECT * FROM volume_options WHERE is_active = true ORDER BY ml` |
| Add | `useAddVolume()` | `INSERT INTO volume_options (label, ml, bottle_size?)` |
| Remove (soft) | `useRemoveVolume()` | `UPDATE volume_options SET is_active = false WHERE id = $1` |

**Default volumes** (seeded via referenceData.ts):
- Half Bottle: 375ml
- Standard: 750ml
- Magnum: 1500ml
- Jeroboam: 3000ml
- Double Magnum: 3000ml

---

## 5. Inventory Rules

**File**: `src/pages/InventorySettings.tsx`  
**Route**: `/settings/inventory`

### Purpose

Configures 20+ operational rules that control how inventory sessions behave, what counting methods are available, and how variances are handled.

### All Settings Keys

Every setting is stored as an individual key in `app_settings` with the `inventory_` prefix.

#### Counting Methods

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `inventory_enable_barcode` | boolean | `true` | Enable barcode scanner as counting method |
| `inventory_enable_ai` | boolean | `true` | Enable AI label recognition as counting method |
| `inventory_enable_manual` | boolean | `true` | Enable manual search as counting method |
| `inventory_counting_unit` | `'bottles' \| 'litres' \| 'both'` | `'bottles'` | Primary unit of measurement for counting |
| `inventory_track_opened` | boolean | `true` | Track opened/partial bottles separately |
| `inventory_show_litres` | boolean | `false` | Show litres equivalent alongside bottle counts |
| `inventory_hide_scanner_desktop` | boolean | `false` | Remove scanner UI on non-mobile devices |

#### Session Rules

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `inventory_require_approval` | boolean | `true` | Require manager approval before finalizing |
| `inventory_allow_count_after_end` | boolean | `false` | Allow adding counts after session is ended |
| `inventory_allow_corrections` | boolean | `false` | Allow staff to correct their own counts |
| `inventory_require_reason` | boolean | `true` | Require adjustment reason for variance |
| `inventory_require_location` | boolean | `false` | Require location assignment for each count |
| `inventory_allow_negative` | boolean | `false` | Allow negative stock values |
| `inventory_allow_recount` | boolean | `true` | Allow recounting same product in session |
| `inventory_baseline_source` | `'syrve' \| 'last_session'` | `'syrve'` | Source of expected stock baseline |

#### Variance & Safety

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `inventory_variance_threshold` | number | `5` | Litres threshold for high-variance alert |
| `inventory_require_evidence` | boolean | `false` | Require photo evidence for high-variance items |
| `inventory_max_unopened_entry` | number | `100` | Maximum unopened bottles per single entry |

#### Session Lifecycle

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `inventory_auto_timeout_hours` | number | `8` | Auto-end session after N hours |
| `inventory_auto_close_days` | number | `3` | Auto-close stale draft sessions after N days |

### Save Behavior

Settings are loaded individually on page mount. On save, all settings are written in a batch:

```typescript
const saveSettings = async () => {
  const settings = {
    inventory_enable_barcode: enableBarcode,
    inventory_enable_ai: enableAi,
    // ... all 20+ settings
  };
  for (const [key, value] of Object.entries(settings)) {
    await updateSetting.mutateAsync({ key, value });
  }
  toast.success('Inventory rules saved');
};
```

### UI Layout

Four collapsible sections using `CollapsibleSection` component:
1. **Counting Methods** — toggles and selects for how staff count
2. **Session Rules** — behavioral toggles for session lifecycle
3. **Variance & Safety** — numeric thresholds and evidence rules
4. **Session Lifecycle** — timeout and auto-close durations

---

## 6. Syrve Integration

**File**: `src/pages/SyrveSettings.tsx` (~999 lines)  
**Route**: `/settings/syrve`

### Purpose

Complete integration hub for the Syrve POS/ERP system. Handles connection configuration, store selection, category filtering, import rules, sync scheduling, and real-time sync execution.

### Section 1: Connection Configuration

#### Fields

| Field | Storage | Notes |
|-------|---------|-------|
| Server URL | `syrve_config.server_url` | Auto-normalized to end with `/api` |
| API Login | `syrve_config.api_login` | Username for Syrve API |
| API Password | Input only, hashed before storage | SHA-1 hashed via edge function |

#### Test Connection Flow

```
User clicks "Test Connection"
        │
        ▼
Frontend calls supabase.functions.invoke('syrve-connect-test', {
  body: { server_url, api_login, api_password }
})
        │
        ▼
Edge function:
  1. SHA-1 hash the password
  2. POST {server_url}/api/auth?login={login}&pass={hash}
  3. Receive syrveToken
  4. GET {server_url}/api/version?key={token}
  5. GET {server_url}/api/corporation/stores?key={token}
  6. GET {server_url}/api/corporation/departments?key={token}
  7. POST {server_url}/api/logout?key={token}
  8. Return { success, password_hash, server_version, stores[], departments[], business_info }
        │
        ▼
Frontend receives:
  - Displays server version badge
  - Populates store selection list
  - Stores password_hash in component state (for save)
  - Extracts business_info for Business Settings import
```

#### Save Connection Flow

```
User clicks "Save Connection"
        │
        ▼
Frontend calls supabase.functions.invoke('syrve-save-config', {
  body: { server_url, api_login, api_password_hash, 
          default_store_id, default_store_name,
          selected_category_ids, selected_store_ids }
})
        │
        ▼
Edge function (uses SERVICE_ROLE_KEY):
  1. Check if syrve_config row exists
  2. Upsert with all provided fields
  3. Set connection_status = 'connected'
  4. Set connection_tested_at = now()
  5. Return { success, config }
```

### Section 2: Store Selection

After successful connection test, stores list is populated.

**UI**: Checkbox list of stores. Each store shows:
- Checkbox for multi-select
- Store name
- Store code badge
- "Set Default" button (star icon)

**Storage**:
- `syrve_config.selected_store_ids` — `text[]` array of Syrve store IDs
- `syrve_config.default_store_id` — Single Syrve store ID for stock sync
- `syrve_config.default_store_name` — Display name of default store

**Logic**: Default store is the primary source for stock balance queries via OLAP reports.

### Section 3: Category Filter

**Component**: `CategoryTreePicker` (`src/components/syrve/CategoryTreePicker.tsx`)

**Props**:
```typescript
interface CategoryTreePickerProps {
  categories: Category[];        // From categories table
  selectedIds: string[];         // Selected category UUIDs
  onSelectionChange: (ids: string[]) => void;
  onDeleteCategory?: (id: string) => void;
  title?: string;
  summaryPrefix?: string;
}
```

**Features**:
- Hierarchical tree built from `categories` table (parent_id relationships)
- Independent parent selection (selecting parent does NOT auto-select children)
- Indeterminate state indicator when some children are selected
- Branch count badges (e.g., "3/7" showing partial selection)
- Search filter across all levels
- Expand/Collapse All buttons
- Select All / Clear All buttons
- Delete category with confirmation dialog

**Storage**: `syrve_config.selected_category_ids` — `text[]` of category UUIDs

**Effect**: When set, the sync function only imports products whose `parentId` (Syrve group ID) matches one of the selected category Syrve group IDs.

### Section 4: Import Rules

#### Product Type Filters

Multi-checkbox selection from 5 Syrve product types:

| Type | Description |
|------|-------------|
| `GOODS` | Standard products (default: selected) |
| `DISH` | Prepared dishes (default: selected) |
| `MODIFIER` | Product modifiers |
| `PREPARED` | Pre-prepared items |
| `SERVICE` | Service items |

**Storage**: `syrve_config.product_type_filters` — `text[]`

#### Field Mapping

| Setting | Key in `syrve_config.field_mapping` JSONB | Default |
|---------|------------------------------------------|---------|
| Extract Vintage | `extract_vintage` | `true` |
| Extract Volume | `extract_volume` | `true` |
| Auto-Map Category | `auto_map_category` | `true` |
| Sync Prices | `sync_prices` | `true` |
| Sync Stock | `sync_stock` | `true` |
| SKU Field | `sku_field` | `'num'` |
| Name Field | `name_field` | `'name'` |
| Description Field | `description_field` | `'description'` |

#### Wine Category Mapping

Separate `CategoryTreePicker` for selecting which product categories should auto-create Wine Catalog entries during sync.

**Storage**: `syrve_config.field_mapping.wine_category_ids` — array of category IDs within the `field_mapping` JSONB

**Logic**: During `enriching_wines` stage of sync, only products from these categories get auto-created as `wines` table entries.

#### Import Inactive Products

**Storage**: `syrve_config.import_inactive_products` — boolean (default: `false`)

When enabled, products marked as `deleted: true` in Syrve are still imported with `is_deleted = true`.

### Section 5: Re-import Mode

**Storage**: `syrve_config.reimport_mode` — text  
**Options**:

| Mode | Behavior | Warning Level |
|------|----------|---------------|
| `merge` | Update existing products, add new ones. Keep products not in current import. | None |
| `hide` | Same as merge, but deactivate (`is_active = false`) products not present in import. | ⚠️ Warning |
| `replace` | Same as hide, but set `is_deleted = true` on missing products. | ⚠️ Warning |
| `fresh` | Delete ALL existing products and re-import from scratch. | 🔴 Destructive |

### Section 6: Sync Schedule

| Setting | Storage | Default |
|---------|---------|---------|
| Auto-Sync Enabled | `syrve_config.auto_sync_enabled` | `false` |
| Sync Interval | `syrve_config.sync_interval_minutes` | `60` |
| Sync Direction | `syrve_config.sync_direction` | `'syrve_to_local'` |

**Interval Options**: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 12hr, 24hr

> **Note**: Auto-sync schedule is stored but no server-side cron executes it yet. This is a known gap.

### Section 7: Sync Execution

#### Sync Now

Triggers a full bootstrap sync:

```typescript
const sync = useSyrveSync();
sync.mutate({ sync_type: 'bootstrap' });
```

#### Refresh Prices & Stock

Triggers a lightweight sync that only updates prices and stock without re-importing products:

```typescript
sync.mutate({ sync_type: 'prices_stock' });
```

#### Real-Time Progress

Progress is polled every 1500ms from `syrve_sync_runs` table:

```typescript
const pollInterval = setInterval(async () => {
  const { data } = await supabase
    .from('syrve_sync_runs')
    .select('status, stats')
    .eq('id', syncRunId)
    .single();
  
  setProgress(data?.stats?.progress || 0);
  setStage(data?.stats?.stage || 'unknown');
  
  if (data?.status === 'success' || data?.status === 'failed') {
    clearInterval(pollInterval);
  }
}, 1500);
```

#### Sync Stages (in order)

| Stage Key | Label | Progress % |
|-----------|-------|------------|
| `authenticating` | Authenticating with Syrve | 5% |
| `syncing_stores` | Syncing stores | 15% |
| `syncing_categories` | Syncing categories | 30% |
| `deleting_products` | Deleting products (fresh mode) | 40% |
| `deleted_products` | Products deleted | 50% |
| `importing_products` | Importing products | 45-55% |
| `fetching_prices` | Fetching prices | 80% |
| `fetching_stock` | Fetching stock balances | 85% |
| `applying_reimport_mode` | Applying re-import rules | 90% |
| `enriching_wines` | Creating wine catalog entries | 90% |
| `ai_enriching` | AI wine enrichment | 95% |
| `completed` | Sync complete | 100% |
| `failed` | Sync failed | — |

### Section 8: Quick Links

| Button | Route | Description |
|--------|-------|-------------|
| Sync Management | `/settings/syrve/sync` | View sync run history, API logs, outbox jobs |
| Integration Testing | `/settings/syrve/testing` | Manual API testing, raw response inspection |

### Save All Settings

The "Save All Settings" button writes all import rules and sync config directly to `syrve_config` table:

```typescript
await supabase.from('syrve_config').update({
  product_type_filters: selectedTypes,
  field_mapping: { ...fieldMapping, wine_category_ids: wineCatIds },
  reimport_mode: reimportMode,
  auto_sync_enabled: autoSync,
  sync_interval_minutes: syncInterval,
  sync_direction: syncDirection,
  import_inactive_products: importInactive,
  selected_category_ids: selectedCatIds,
}).eq('id', configId);
```

---

## 7. AI Recognition Settings

**File**: `src/pages/AiSettings.tsx`  
**Route**: `/settings/ai`

### Purpose

Configures the AI-powered wine label recognition pipeline and search index.

### Data Source

Single row in `ai_config` table.

### Section 1: Wine Index Statistics

Computed from the `wines` table:

```typescript
const { data: wines } = await supabase
  .from('wines')
  .select('id, search_text, embedding')
  .eq('is_active', true);

const totalWines = wines?.length || 0;
const textIndexed = wines?.filter(w => w.search_text).length || 0;
const embeddingCount = wines?.filter(w => w.embedding).length || 0;
```

Displayed as three stat cards.

### Section 2: Recognition Pipeline

| Setting | Column | Type | Default |
|---------|--------|------|---------|
| Enable AI Recognition | `is_active` | boolean | `true` |
| Vision Verification | `settings.vision_verification` | boolean | `false` |
| Active Model | `model_name` | string | `'google/gemini-2.5-flash'` |

### Section 3: Thresholds

| Setting | Column/Key | Type | Default |
|---------|-----------|------|---------|
| Auto-Preselect Threshold | `settings.auto_preselect_threshold` | number (0-1) | `0.7` |
| Rescan Suggestion Threshold | `settings.rescan_threshold` | number (0-1) | `0.4` |
| Rate Limit | `rate_limit_per_minute` | integer | `60` |

### Section 4: Image Policy

| Setting | Column | Type | Default |
|---------|--------|------|---------|
| Max Image Size | `max_image_size_mb` | integer | `4` |
| Supported Formats | `supported_formats` | text[] | `['image/jpeg', 'image/png', 'image/webp']` |

### Section 5: API Configuration

| Setting | Key in `settings` JSONB | Notes |
|---------|------------------------|-------|
| Custom API Key | `custom_api_key` | Optional; if set, edge functions use this instead of `LOVABLE_API_KEY` |
| Custom Gateway URL | `custom_gateway_url` | Optional; overrides default `https://ai.gateway.lovable.dev/v1/chat/completions` |

**Fallback Logic** (in edge functions):
```typescript
const apiKey = customApiKey || Deno.env.get("LOVABLE_API_KEY");
const gatewayUrl = customGatewayUrl || "https://ai.gateway.lovable.dev/v1/chat/completions";
```

### Section 6: Search Index Management

**"Rebuild Search Index" Button**:

```typescript
await supabase.functions.invoke('generate-wine-embeddings', {
  body: { batch_size: 100, force_refresh: false }
});
```

The edge function:
1. Fetches wines where `search_text IS NULL` (or all if `force_refresh: true`)
2. Builds search text from: producer, name, vintage, region, country, appellation, grape_varieties, volume_ml
3. Updates `wines.search_text` for trigram matching
4. If `OPENAI_API_KEY` secret exists, also generates vector embeddings via `text-embedding-3-small` model
5. Updates `wines.embedding` column

### Save Behavior

All changes saved to `ai_config` table:

```typescript
await supabase.from('ai_config').update({
  is_active: isActive,
  model_name: modelName,
  rate_limit_per_minute: rateLimit,
  max_image_size_mb: maxImageSize,
  settings: {
    ...currentSettings,
    custom_api_key: customKey || null,
    custom_gateway_url: customUrl || null,
    auto_preselect_threshold: threshold,
    rescan_threshold: rescanThreshold,
    vision_verification: visionVerify,
  },
}).eq('id', configId);
```

---

## 8. Roles & Permissions

**File**: `src/pages/RolesPermissions.tsx`  
**Route**: `/settings/roles`

### Purpose

Define custom roles with granular module-level permissions. These roles are assigned to users and control feature access across the application.

### Permission Model

#### Permission Levels

```typescript
type PermissionLevel = 'none' | 'view' | 'edit' | 'full';
```

| Level | Meaning |
|-------|---------|
| `none` | No access to the feature |
| `view` | Read-only access |
| `edit` | Can create and modify, but not delete or manage settings |
| `full` | Complete access including delete and admin operations |

#### Permission Modules (defined in `src/data/referenceData.ts`)

| Module Key | Label | Sub-Actions |
|------------|-------|-------------|
| `dashboard` | Dashboard | `view_dashboard`, `view_charts`, `export_reports` |
| `inventory` | Inventory | `view_inventory`, `start_count`, `submit_count`, `approve_count`, `view_history` |
| `wines` | Wine Catalog | `view_wines`, `add_wine`, `edit_wine`, `delete_wine`, `import_wines` |
| `products` | Syrve Products | `view_products`, `sync_products`, `manage_mappings` |
| `reports` | Reports | `view_reports`, `export_reports`, `schedule_reports` |
| `settings` | Settings | `view_settings`, `edit_settings`, `manage_roles`, `manage_users` |
| `ai` | AI Recognition | `use_scanner`, `review_matches`, `manage_ai_config` |
| `audit` | Audit Log | `view_audit`, `export_audit` |
| `syrve` | Syrve Integration | `view_syrve`, `manage_connection`, `run_sync`, `manage_outbox` |

#### Permission Key Format

```typescript
const permKey = (moduleKey: string, actionKey: string) => `${moduleKey}.${actionKey}`;
// Example: 'inventory.start_count', 'wines.delete_wine'
```

### Storage

**Table**: `app_roles_config`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `role_name` | text | Display name (e.g., "Sommelier") |
| `color` | text | Hex color for badge display |
| `is_builtin` | boolean | `true` for system roles (cannot be deleted) |
| `permissions` | JSONB | `{ "module.action": "level" }` map |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto via trigger |

**Example `permissions` JSONB**:
```json
{
  "dashboard.view_dashboard": "full",
  "dashboard.view_charts": "full",
  "dashboard.export_reports": "edit",
  "inventory.view_inventory": "full",
  "inventory.start_count": "full",
  "inventory.submit_count": "full",
  "inventory.approve_count": "none",
  "wines.view_wines": "view",
  "wines.add_wine": "none"
}
```

### Hooks

```typescript
// Fetch all roles ordered by is_builtin DESC, then role_name
useRolesConfig() → RoleConfigRow[]

// Create new role
useAddRoleConfig() → mutation({ role_name, color, permissions })

// Update role properties
useUpdateRoleConfig() → mutation({ id, updates: { role_name?, color?, permissions? } })

// Delete custom role (built-in roles blocked at frontend)
useRemoveRoleConfig() → mutation(id)

// Set single permission
useSetRolePermission() → mutation({ roleId, currentPermissions, permissionKey, level })
// Merges new key into existing permissions JSONB, then UPDATE

// Set all permissions for a module at once
useSetModulePermissions() → mutation({ roleId, currentPermissions, moduleKey, level })
// Iterates ALL_MODULES[moduleKey].subActions, sets each to `level`
```

### UI Layout

```
┌─────────────────────────────────────────────────┐
│ Roles & Permissions                              │
├─────────────────────────────────────────────────┤
│ [+ Add Role]  [Role 1 ●] [Role 2 ●] [Role 3 ●]│
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─── Module: Dashboard ─────────────────────┐   │
│ │ Module-level: (none) (view) (edit) (●full) │   │
│ │                                            │   │
│ │  view_dashboard:  ○none ○view ○edit ●full │   │
│ │  view_charts:     ○none ○view ○edit ●full │   │
│ │  export_reports:  ○none ○view ●edit ○full │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌─── Module: Inventory ─────────────────────┐   │
│ │ ...                                        │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌─── Module: Wine Catalog ──────────────────┐   │
│ │ ...                                        │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Built-in Roles Protection

- `is_builtin = true` roles show a lock icon
- Delete button is hidden for built-in roles
- Permission editing is still allowed for built-in roles (except Super Admin which has all permissions locked to `full`)

---

## 9. User Management

**File**: `src/pages/UserManagement.tsx`  
**Route**: `/users`

### Purpose

CRUD interface for managing application users: create, edit, suspend, and assign roles.

### Current State

> ⚠️ **KNOWN GAP**: The frontend currently uses **mock data** (`mockUsers` array). It is NOT connected to the database. The edge function `manage-users` exists and is fully functional but is not yet invoked from the frontend.

### Intended Data Flow

```
Frontend (UserManagement.tsx)
        │
        ▼
supabase.functions.invoke('manage-users', {
  body: { action: 'list' | 'create' | 'update' | 'deactivate', ...params }
})
        │
        ▼
Edge Function (manage-users/index.ts)
  1. Verifies caller is admin via user_roles check
  2. Uses SUPABASE_SERVICE_ROLE_KEY for admin operations
  3. Dispatches by action:
```

### Edge Function Actions

#### `action: 'list'`

```typescript
// Fetches all profiles + user_roles
const { data: profiles } = await adminClient
  .from("profiles")
  .select("*")
  .is("deleted_at", null)
  .order("created_at", { ascending: false });

const { data: roles } = await adminClient.from("user_roles").select("*");
const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

// Returns merged profiles with role
return { users: profiles.map(p => ({ ...p, role: roleMap.get(p.id) || "staff" })) };
```

#### `action: 'create'`

```typescript
// 1. Create auth.users entry (email confirmed automatically)
const { data: newUser } = await adminClient.auth.admin.createUser({
  email, password, email_confirm: true,
  user_metadata: { display_name }
});

// 2. Update profiles table
await adminClient.from("profiles").update({
  first_name, last_name, display_name, phone, department, job_title
}).eq("id", newUser.user.id);

// 3. Assign role in user_roles table
await adminClient.from("user_roles").insert({
  user_id: newUser.user.id,
  role: role === "admin" ? "admin" : "staff"
});
```

#### `action: 'update'`

```typescript
// 1. Update profiles fields (only provided ones)
await adminClient.from("profiles").update(profileUpdate).eq("id", user_id);

// 2. Replace role if changed
if (role) {
  await adminClient.from("user_roles").delete().eq("user_id", user_id);
  await adminClient.from("user_roles").insert({ user_id, role: appRole });
}

// 3. Update password if provided
if (password) {
  await adminClient.auth.admin.updateUserById(user_id, { password });
}
```

#### `action: 'deactivate'`

```typescript
await adminClient.from("profiles").update({ is_active: false }).eq("id", user_id);
```

### UserFormDialog Component

**File**: `src/components/UserFormDialog.tsx`

Form fields:
- First Name, Last Name (text)
- Email (email, required for create)
- Password (with strength meter: weak/medium/strong based on length + character classes)
- Role (select from `app_roles_config` table)
- Status (Active/Suspended)
- Phone, Job Title, Department, Notes (optional)

### Frontend Search & Filters

| Feature | Implementation |
|---------|---------------|
| Search | Filter by name OR email (case-insensitive includes) |
| Role Filter | Filter by role name |
| Status Filter | Filter by active/suspended/locked |
| Sort | By name, last login, activity |

### User Card Display

Each user renders as a card with:
- Avatar circle with initials + dynamic color
- Full name + email
- Role badge (colored from `app_roles_config.color`)
- Status badge (green "Active", yellow "Suspended", red "Locked")
- Last login relative time
- Action menu: Edit, Suspend/Activate, Delete

---

## 10. Database Schema Reference

### Settings-Specific Tables

#### app_settings
```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: Admin manage ALL, Auth SELECT true
```

#### ai_config
```sql
CREATE TABLE ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'lovable',
  model_name TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  is_active BOOLEAN DEFAULT true,
  max_image_size_mb INTEGER DEFAULT 4,
  rate_limit_per_minute INTEGER DEFAULT 60,
  supported_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp'],
  settings JSONB DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: Admin manage ALL, Auth SELECT true
```

#### syrve_config
```sql
CREATE TABLE syrve_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_url TEXT NOT NULL DEFAULT 'https://parra.syrve.online:443/resto/api',
  api_login TEXT NOT NULL DEFAULT '',
  api_password_hash TEXT,
  connection_status TEXT DEFAULT 'not_configured',
  connection_tested_at TIMESTAMPTZ,
  default_store_id TEXT,
  default_store_name TEXT,
  selected_store_ids TEXT[],
  selected_category_ids TEXT[],
  product_type_filters TEXT[] DEFAULT ARRAY['GOODS', 'DISH'],
  field_mapping JSONB DEFAULT '{"sku_field":"num","name_field":"name","extract_volume":true,"extract_vintage":true,"auto_map_category":true,"description_field":"description"}',
  reimport_mode TEXT NOT NULL DEFAULT 'merge',
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60,
  sync_direction TEXT DEFAULT 'syrve_to_local',
  auto_create_wines BOOLEAN DEFAULT false,
  import_inactive_products BOOLEAN DEFAULT false,
  testing_mode BOOLEAN NOT NULL DEFAULT false,
  sync_lock_until TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: Admin manage ALL, Auth SELECT true
```

#### app_roles_config
```sql
CREATE TABLE app_roles_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: Admin manage ALL, Auth SELECT true
```

#### glass_dimensions
```sql
CREATE TABLE glass_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  volume_litres NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: Admin manage ALL, Auth SELECT true
```

#### locations + sub_locations
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sub_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);
-- RLS: Admin manage ALL, Auth SELECT true (both tables)
```

#### volume_options
```sql
CREATE TABLE volume_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  ml INTEGER NOT NULL,
  bottle_size TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);
-- RLS: Admin manage ALL, Auth SELECT true
```

### Supporting Tables

| Table | Purpose | Write Access |
|-------|---------|--------------|
| `syrve_sync_runs` | Sync execution history with stats JSONB | Admin manage, Auth read |
| `syrve_api_logs` | Per-API-call request/response logs | Admin manage only |
| `syrve_raw_objects` | Raw Syrve entity payloads with hash dedup | Admin manage, Auth read |
| `syrve_outbox_jobs` | Pending Syrve write-back jobs | Admin manage, Auth read |
| `stores` | Synced Syrve store definitions | Admin manage, Auth read |
| `categories` | Synced Syrve product groups (hierarchical) | Admin manage, Auth read |
| `audit_logs` | System-wide action audit trail | Admin read, Auth insert |
| `profiles` | User profile data | Own profile read/update, Admin read all |
| `user_roles` | User-to-role mapping (enum: app_role) | Admin CRUD, Users read own |

---

## 11. Edge Functions Reference

### syrve-connect-test

**Path**: `supabase/functions/syrve-connect-test/index.ts`  
**JWT**: Not required (verify_jwt = false)  
**Auth**: Manual Bearer token check + `getUser()`

**Request**:
```json
{
  "server_url": "https://example.syrve.online:443/resto",
  "api_login": "admin",
  "api_password": "plaintext_password"
}
```

**Response (success)**:
```json
{
  "success": true,
  "message": "Connection successful",
  "password_hash": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
  "server_version": "7.8.1.2345",
  "stores": [
    { "id": "abc-123", "name": "Main Store", "code": "MS01", "type": "STORE" }
  ],
  "departments": [...],
  "business_info": {
    "legal_name": "Restaurant LLC",
    "business_name": "The Wine Bar",
    "taxpayer_id": "1234567890",
    "address": "123 Main St",
    "country": "UAE",
    "city": "Dubai"
  }
}
```

**Internal Flow**:
1. SHA-1 hash password
2. `GET /api/auth?login={login}&pass={hash}` → receive session token
3. `GET /api/version?key={token}` → server version
4. `GET /api/corporation/stores?key={token}` → XML → parse stores
5. `GET /api/corporation/departments?key={token}` → XML → parse departments + extract business info
6. `GET /api/logout?key={token}` → release license
7. Return aggregated response

### syrve-save-config

**Path**: `supabase/functions/syrve-save-config/index.ts`  
**Auth**: Bearer token + user verification

**Request**:
```json
{
  "server_url": "https://example.syrve.online:443/resto/api",
  "api_login": "admin",
  "api_password_hash": "a94a8fe5...",
  "default_store_id": "abc-123",
  "default_store_name": "Main Store",
  "selected_category_ids": ["uuid1", "uuid2"],
  "selected_store_ids": ["syrve-id-1", "syrve-id-2"]
}
```

**Logic**: Uses `SUPABASE_SERVICE_ROLE_KEY` to upsert `syrve_config` row. Sets `connection_status = 'connected'` and `connection_tested_at = now()`.

### syrve-sync

**Path**: `supabase/functions/syrve-sync/index.ts` (1111 lines)  
**Auth**: Bearer token + user verification

**Request**:
```json
{ "sync_type": "bootstrap" | "prices_stock" | "stores" | "categories" | "products" }
```

**Sync Lifecycle**:
1. Read `syrve_config` for credentials and rules
2. Check `sync_lock_until` (prevents concurrent syncs)
3. Set 5-minute sync lock
4. Create `syrve_sync_runs` row with `status: 'running'`
5. Authenticate with Syrve API
6. Execute sync stages based on `sync_type`
7. Update progress via `syrve_sync_runs.stats` JSONB (polled by frontend)
8. On success: set `status: 'success'`, clear lock
9. On failure: set `status: 'failed'`, record error, clear lock
10. Always logout from Syrve to release license

**Sub-Functions**:
- `syncStores()` — Fetches `/corporation/stores`, upserts into `syrve_raw_objects` + `stores`
- `syncCategories()` — Fetches `/v2/entities/products/group/list`, upserts into `categories`, resolves parent_id
- `syncProducts()` — Fetches `/v2/entities/products/list`, applies category + type filters, batch upserts
- `syncPrices()` — Uses OLAP report API for pricing data
- `syncStock()` — Uses OLAP report API for stock balances by store
- `enrichWinesFromProducts()` — Auto-creates `wines` entries from wine-category products
- `aiEnrichNewWines()` — Invokes AI to detect country, region, grape, wine type for new wines
- `applyReimportMode()` — Handles hide/replace logic for products not in current import
- `deleteAllProducts()` — Fresh mode: removes all products before re-import

**Hash-Based Deduplication**: Each entity's JSON payload is SHA-1 hashed. If the hash matches the stored `payload_hash` in `syrve_raw_objects`, the entity is skipped (no write = faster sync).

### manage-users

**Path**: `supabase/functions/manage-users/index.ts`  
**Auth**: Bearer token + admin role check via `user_roles` table

**Actions**: `list`, `create`, `update`, `deactivate`

See [Section 9: User Management](#9-user-management) for detailed action descriptions.

### ai-recognize-label

**Path**: `supabase/functions/ai-recognize-label/index.ts`  
**Auth**: Bearer token + claims verification

**Request**:
```json
{
  "image_base64": "base64_encoded_jpeg",
  "session_id": "optional_inventory_session_uuid"
}
```

**Pipeline**:
1. Read `ai_config` for custom API key/gateway
2. Create `ai_recognition_attempts` record with `status: 'processing'`
3. Send image to AI Gateway with vision prompt
4. Parse extracted JSON (product_name, producer, vintage, region, etc.)
5. Multi-strategy candidate retrieval:
   - **Strategy 1**: Trigram similarity via `match_wines_trigram()` RPC
   - **Strategy 2**: Vector embedding via `match_wines_embedding()` RPC (if OpenAI key exists)
   - **Strategy 3**: Fallback ILIKE search on `wines` table
6. Score candidates: name match (40pts), producer (30pts), vintage (20pts), region (10pts), method bonus
7. Return best match with confidence score

**Response**:
```json
{
  "status": "success" | "manual_review" | "failed" | "select_variant",
  "attempt_id": "uuid",
  "extracted": { "product_name": "...", "producer": "...", ... },
  "confidence": 85,
  "match": { "id": "wine_uuid", "name": "...", "producer": "...", ... },
  "match_method": "hybrid" | "trigram" | "embedding" | "ilike",
  "processing_time_ms": 1234
}
```

### ai-enrich-wine

**Path**: `supabase/functions/ai-enrich-wine/index.ts`  
**Auth**: Bearer token + user verification

**Request**: `{ "wine_id": "uuid" }`

**Logic**:
1. Fetch wine from database
2. Read `ai_config` for API key/gateway
3. Send wine context to AI with sommelier system prompt
4. Parse enrichment: country, region, grape_varieties, wine_type, tasting_notes, food_pairing, sweetness, acidity, tannins, body
5. Return enrichment data (NOT auto-saved; frontend decides whether to apply)

### generate-wine-embeddings

**Path**: `supabase/functions/generate-wine-embeddings/index.ts`  
**Auth**: Bearer token + admin role check

**Request**: `{ "batch_size": 100, "force_refresh": false }`

**Logic**:
1. Fetch wines missing `search_text` (or all if `force_refresh`)
2. Build search text: `PRODUCER NAME VINTAGE REGION COUNTRY APPELLATION GRAPES VOLUME_ML`
3. Update `wines.search_text`
4. If `OPENAI_API_KEY` exists: generate embeddings via `text-embedding-3-small`, update `wines.embedding`

### auth-login-username

**Path**: `supabase/functions/auth-login-username/index.ts`  
**Purpose**: Username-based login for staff who don't have email addresses

---

## 12. React Hooks Reference

### Generic Settings

```typescript
// src/hooks/useAppSettings.ts

// Read a single setting with fallback default
function useAppSetting<T = any>(key: string, defaultValue: T): UseQueryResult<T>
// Query: SELECT value FROM app_settings WHERE key = $1

// Write a setting (upsert pattern)
function useUpdateAppSetting(): UseMutationResult
// Logic: Check if key exists → UPDATE or INSERT
// Invalidates: ['app_settings', key]
```

### Glass Dimensions

```typescript
// src/hooks/useGlassDimensions.ts

interface GlassDimensionRow {
  id: string; label: string; volume_litres: number; is_active: boolean; created_at: string;
}

function useGlassDimensions(): UseQueryResult<GlassDimensionRow[]>
// Query: SELECT * FROM glass_dimensions WHERE is_active = true ORDER BY volume_litres

function useAddGlassDimension(): UseMutationResult
// Mutation: INSERT INTO glass_dimensions (label, volume_litres) VALUES ($1, $2)

function useRemoveGlassDimension(): UseMutationResult
// Mutation: UPDATE glass_dimensions SET is_active = false WHERE id = $1
```

### Locations

```typescript
// src/hooks/useLocations.ts

interface LocationWithSubs {
  id: string; name: string; type: string | null; is_active: boolean; created_at: string;
  sub_locations: SubLocationRow[];
}

function useLocations(): UseQueryResult<LocationWithSubs[]>
// Parallel queries: locations (active) + sub_locations (active)
// Client-side join: subs filtered by location_id

function useAddLocation(): UseMutationResult<void, Error, { name: string; type?: string }>
function useRemoveLocation(): UseMutationResult<void, Error, string>  // soft-delete
function useAddSubLocation(): UseMutationResult<void, Error, { location_id: string; name: string }>
function useRemoveSubLocation(): UseMutationResult<void, Error, string>  // soft-delete
```

### Volumes

```typescript
// src/hooks/useVolumes.ts

interface VolumeRow {
  id: string; label: string; ml: number; bottle_size: string | null; is_active: boolean;
}

function useVolumes(): UseQueryResult<VolumeRow[]>
function useAddVolume(): UseMutationResult<void, Error, { label: string; ml: number; bottle_size?: string }>
function useRemoveVolume(): UseMutationResult<void, Error, string>  // soft-delete
```

### Roles

```typescript
// src/hooks/useRolesConfig.ts

interface RoleConfigRow {
  id: string; role_name: string; color: string | null; is_builtin: boolean;
  permissions: Record<string, PermissionLevel>; created_at: string; updated_at: string;
}

function useRolesConfig(): UseQueryResult<RoleConfigRow[]>
function useAddRoleConfig(): UseMutationResult
function useUpdateRoleConfig(): UseMutationResult<void, Error, { id: string; updates: Partial<...> }>
function useRemoveRoleConfig(): UseMutationResult<void, Error, string>

// Granular permission mutations
function useSetRolePermission(): UseMutationResult<void, Error, {
  roleId: string; currentPermissions: Record<string, PermissionLevel>;
  permissionKey: string; level: PermissionLevel;
}>

function useSetModulePermissions(): UseMutationResult<void, Error, {
  roleId: string; currentPermissions: Record<string, PermissionLevel>;
  moduleKey: string; level: PermissionLevel;
}>
```

### Syrve

```typescript
// src/hooks/useSyrve.ts (comprehensive hook file)

function useSyrveConfig(): UseQueryResult<SyrveConfigRow>
function useSyrveStores(): UseQueryResult<StoreRow[]>
function useSyrveCategories(): UseQueryResult<CategoryRow[]>
function useSyrveProducts(filters?): UseQueryResult<ProductRow[]>
function useSyrveSyncRuns(): UseQueryResult<SyncRunRow[]>
function useSyrveApiLogs(syncRunId?): UseQueryResult<ApiLogRow[]>
function useSyrveOutboxJobs(): UseQueryResult<OutboxJobRow[]>
function useSyrveBarcodeCount(): UseQueryResult<number>

// Mutations
function useTestSyrveConnection(): UseMutationResult
function useSaveSyrveConfig(): UseMutationResult
function useSyrveSync(): UseMutationResult<SyncResult, Error, { sync_type: string }>
function useForceStopSync(): UseMutationResult
function useToggleTestingMode(): UseMutationResult
function useProcessOutbox(): UseMutationResult
```

### Legacy Zustand Store

```typescript
// src/stores/settingsStore.ts

// IN-MEMORY ONLY — NOT persisted to database
// Contains default values from referenceData.ts
// Used as fallback when hooks haven't loaded

interface SettingsState {
  glassDimensions: GlassDimension[];
  locations: LocationConfig[];
  volumes: VolumeOption[];
  roles: AppRole[];
  openedBottleUnit: 'fraction' | 'litres';
  // ... CRUD actions (local state only)
}
```

> **Migration Note**: The Zustand `settingsStore` predates the database hooks. Components should prefer the React Query hooks (`useGlassDimensions`, `useLocations`, `useVolumes`, `useRolesConfig`) which persist to the database. The Zustand store remains for backward compatibility.

---

## 13. Routing & Access Control

### Route Map

| Route | Component | File | Access Control |
|-------|-----------|------|----------------|
| `/settings` | `AppSettings` | `src/pages/AppSettings.tsx` | admin, super_admin |
| `/settings/business` | `BusinessSettings` | `src/pages/BusinessSettings.tsx` | admin, super_admin |
| `/settings/general` | `GeneralSettings` | `src/pages/GeneralSettings.tsx` | admin, super_admin |
| `/settings/inventory` | `InventorySettings` | `src/pages/InventorySettings.tsx` | admin, super_admin |
| `/settings/syrve` | `SyrveSettings` | `src/pages/SyrveSettings.tsx` | admin, super_admin |
| `/settings/syrve/sync` | `SyrveSyncPage` | `src/pages/SyrveSyncPage.tsx` | admin, super_admin |
| `/settings/syrve/testing` | `SyrveTestingPage` | `src/pages/SyrveTestingPage.tsx` | admin, super_admin |
| `/settings/ai` | `AiSettings` | `src/pages/AiSettings.tsx` | admin, super_admin |
| `/settings/roles` | `RolesPermissions` | `src/pages/RolesPermissions.tsx` | settings.full perm |
| `/users` | `UserManagement` | `src/pages/UserManagement.tsx` | admin, super_admin |

### Sidebar Navigation Structure

```
Settings (gear icon)
├── Settings Home (/settings)
├── Business Settings (/settings/business)
├── General Settings (/settings/general)
├── Inventory Rules (/settings/inventory)
├── Syrve Integration (/settings/syrve)
├── AI Recognition (/settings/ai)
├── Roles & Permissions (/settings/roles)
└── User Management (/users)
```

### Access Control Implementation

All settings pages are wrapped within authenticated routes via `AuthProvider`. The role check is performed at the component level:

```typescript
// In each settings page
const { data: userRole } = useQuery({
  queryKey: ['user_role'],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
    return data;
  }
});

// Redirect non-admins
if (userRole && userRole.role !== 'admin' && userRole.role !== 'super_admin') {
  navigate('/dashboard');
}
```

---

## 14. Security Model

### RLS Policy Pattern

All settings tables follow the same pattern:

```sql
-- Admin full access
CREATE POLICY "Admins manage {table}" ON public.{table}
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated read access
CREATE POLICY "Auth read {table}" ON public.{table}
FOR SELECT USING (true);
```

**Important**: These are **RESTRICTIVE** policies (not PERMISSIVE). The `Auth read` policy uses `USING (true)` which means any authenticated user can read, but only admins can write.

### has_role Function

```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'super_admin')
  )
$$;
```

**SECURITY DEFINER**: Executes with function owner's privileges, bypassing RLS on `user_roles` table. This prevents recursive RLS checks.

**super_admin bypass**: The function returns `true` for `super_admin` role regardless of which role is being checked.

### Edge Function Security

| Function | Auth Method | Admin Check |
|----------|-------------|-------------|
| `syrve-connect-test` | Bearer token + getUser() | No (any authenticated user) |
| `syrve-save-config` | Bearer token + getUser() | No (relies on RLS) |
| `syrve-sync` | Bearer token + getUser() | No (relies on RLS) |
| `manage-users` | Bearer token + getUser() | Yes (checks user_roles for admin) |
| `ai-recognize-label` | Bearer token + getClaims() | No (any authenticated user) |
| `ai-enrich-wine` | Bearer token + getUser() | No (any authenticated user) |
| `generate-wine-embeddings` | Bearer token + getClaims() | Yes (checks user_roles for admin) |

### Password Security

Syrve API passwords are **never stored in plaintext**:
1. User enters password in frontend
2. Password sent to `syrve-connect-test` edge function via HTTPS
3. Edge function computes SHA-1 hash server-side
4. Only the hash (`api_password_hash`) is stored in `syrve_config`
5. Frontend never receives or stores the original password

---

## 15. Known Gaps & Future Work

### Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **User Management uses mock data** | No real user CRUD from frontend | 🔴 High |
| **UserFormDialog save is toast-only** | Create/Edit/Delete actions don't call `manage-users` edge function | 🔴 High |

### Functional Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| Auto-sync scheduler not implemented | `auto_sync_enabled` is stored but no cron triggers `syrve-sync` | 🟡 Medium |
| Bidirectional sync not implemented | UI option exists but only `syrve_to_local` direction works | 🟡 Medium |
| Database backup/export settings | Settings card shows "Coming Soon" | 🟢 Low |
| Notifications settings | Settings card shows "Coming Soon" | 🟢 Low |

### Architecture Notes

| Item | Current State | Recommended Action |
|------|--------------|-------------------|
| Zustand `settingsStore` | In-memory only, duplicates React Query hooks | Deprecate in favor of database-backed hooks |
| `referenceData.ts` defaults | Hardcoded fallback data | Keep as seed data; prefer DB values at runtime |
| Role-based UI access | Component-level redirect check | Consider route-level guard component |
| AI config `settings` JSONB | Catch-all for thresholds and keys | Consider promoting frequently-used fields to typed columns |

---

## Appendix A: File Index

| File | Type | Purpose |
|------|------|---------|
| `src/pages/AppSettings.tsx` | Page | Settings home dashboard |
| `src/pages/BusinessSettings.tsx` | Page | Organization profile & locale |
| `src/pages/GeneralSettings.tsx` | Page | Reference data CRUD |
| `src/pages/InventorySettings.tsx` | Page | Inventory operational rules |
| `src/pages/SyrveSettings.tsx` | Page | Syrve integration hub (~999 lines) |
| `src/pages/SyrveSyncPage.tsx` | Page | Sync history & logs |
| `src/pages/SyrveTestingPage.tsx` | Page | API testing interface |
| `src/pages/AiSettings.tsx` | Page | AI pipeline configuration |
| `src/pages/RolesPermissions.tsx` | Page | Role & permission management |
| `src/pages/UserManagement.tsx` | Page | User CRUD (currently mock) |
| `src/components/UserFormDialog.tsx` | Component | User create/edit dialog |
| `src/components/CollapsibleSection.tsx` | Component | Expandable settings section |
| `src/components/syrve/CategoryTreePicker.tsx` | Component | Hierarchical category selector |
| `src/hooks/useAppSettings.ts` | Hook | Generic key-value settings |
| `src/hooks/useGlassDimensions.ts` | Hook | Glass dimension CRUD |
| `src/hooks/useLocations.ts` | Hook | Location + sub-location CRUD |
| `src/hooks/useVolumes.ts` | Hook | Volume option CRUD |
| `src/hooks/useRolesConfig.ts` | Hook | Role config CRUD |
| `src/hooks/useSyrve.ts` | Hook | All Syrve-related queries & mutations |
| `src/stores/settingsStore.ts` | Store | Legacy Zustand store (in-memory) |
| `src/data/referenceData.ts` | Data | Default values, permission module definitions |
| `supabase/functions/syrve-connect-test/index.ts` | Edge Function | Connection testing |
| `supabase/functions/syrve-save-config/index.ts` | Edge Function | Config persistence |
| `supabase/functions/syrve-sync/index.ts` | Edge Function | Full sync orchestrator |
| `supabase/functions/syrve-process-outbox/index.ts` | Edge Function | Outbox job processor |
| `supabase/functions/syrve-stock-snapshot/index.ts` | Edge Function | Stock state capture |
| `supabase/functions/ai-recognize-label/index.ts` | Edge Function | Label recognition pipeline |
| `supabase/functions/ai-enrich-wine/index.ts` | Edge Function | Wine metadata enrichment |
| `supabase/functions/generate-wine-embeddings/index.ts` | Edge Function | Search index builder |
| `supabase/functions/manage-users/index.ts` | Edge Function | User management API |
| `supabase/functions/auth-login-username/index.ts` | Edge Function | Username auth |
