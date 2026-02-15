

# Settings Module -- Complete Solution Document

This plan creates a comprehensive technical specification document covering every Settings component, its logic, integrations, database interactions, and edge functions. The document will be stored at `new/Code/settings_module_specification.md`.

---

## Document Structure

The specification will cover the following modules in detail:

### 1. Settings Home (`/settings` -- `AppSettings.tsx`)
- Health dashboard with 4 real-time status cards: Syrve connection, last sync, AI recognition, active users
- Dynamic alert system detecting misconfigurations (no connection, no default store, no products synced)
- Navigation grid to 9 sub-modules (7 active, 2 future: Database, Notifications)
- Access control: admin/super_admin only, redirects others to `/dashboard`
- Data sources: `useSyrveConfig()`, `useSyrveSyncRuns()`, `useSyrveProducts()`, `useAiConfig()`, `useUserCount()`

### 2. Business Settings (`/settings/business` -- `BusinessSettings.tsx`)
- Organization profile: business name, legal name, address, country, city, taxpayer ID
- Locale configuration: language (5 options), currency (10 options), timezone (12 options)
- Operational defaults: default bottle size (ml), default glass size (ml)
- Persistence: each field stored as individual key-value in `app_settings` table
- Syrve import support: business info auto-populated from Syrve connection test response
- Hook: `useAppSetting()` / `useUpdateAppSetting()` for read/write

### 3. General Settings (`/settings/general` -- `GeneralSettings.tsx`)
- Opened Bottle Measurement: fraction vs litres toggle (stored in `app_settings.opened_bottle_unit`)
- Glass Dimensions: CRUD on `glass_dimensions` table (label + volume_litres). Hooks: `useGlassDimensions()`, `useAddGlassDimension()`, `useRemoveGlassDimension()`
- Locations with Sub-locations: hierarchical CRUD on `locations` + `sub_locations` tables. Expandable tree UI. Hooks: `useLocations()`, `useAddLocation()`, `useRemoveLocation()`, `useAddSubLocation()`, `useRemoveSubLocation()`
- Bottle Volumes: CRUD on `volume_options` table (ml + label + bottle_size). Hooks: `useVolumes()`, `useAddVolume()`, `useRemoveVolume()`

### 4. Inventory Rules (`/settings/inventory` -- `InventorySettings.tsx`)
- 20+ configurable rules stored as individual `app_settings` keys
- Counting Methods section: barcode scanner toggle, AI scanner toggle, manual search toggle, counting unit (bottles/litres/both), track opened bottles, show litres equivalent, hide scanner on desktop
- Session Rules section: approval required, allow counting after end, allow staff corrections, require adjustment reason, require location, allow negative stock, allow recount, baseline source (syrve/last_session)
- Variance & Safety section: variance threshold (litres), require evidence for high variance, max unopened per entry
- Session Lifecycle section: auto-timeout (hours), auto-close stale sessions (days)
- All settings saved in bulk via `useUpdateAppSetting()` with `inventory_*` key prefix

### 5. Syrve Integration (`/settings/syrve` -- `SyrveSettings.tsx`, 999 lines)
- **Connection Section**: Server URL, API login, API password fields. Test connection via `syrve-connect-test` edge function. Returns stores list, server version, business info. Password hashed server-side and stored as `api_password_hash`. Save via `syrve-save-config` edge function.
- **Store Selection Section**: Multi-store checkbox selection with default store designation. Stored as `selected_store_ids` array and `default_store_id` in `syrve_config`.
- **Category Filter Section**: `CategoryTreePicker` component for hierarchical category selection. Stored as `selected_category_ids` array.
- **Import Rules Section**: Product type filters (GOODS, DISH, MODIFIER, PREPARED, SERVICE). Field mapping toggles (extract vintage, extract volume, auto-map category). Data sync options (sync prices, sync stock). Wine category mapping (separate `CategoryTreePicker` for `wine_category_ids` in `field_mapping` JSONB). Import inactive products toggle.
- **Sync Schedule Section**: Auto-sync toggle with configurable interval (15min to 24hr). Sync direction (one-way or bidirectional).
- **Re-import Mode**: 4 modes (merge, hide, replace, fresh) with destructive warnings.
- **Sync Execution**: Save All Settings button writes to `syrve_config` table directly. Sync Now triggers `syrve-sync` edge function. Refresh Prices & Stock triggers `syrve-sync` with `prices_stock` type. Real-time progress polling via `syrve_sync_runs` table every 1.5s. Stage-based progress bar with 12 stages (authenticating through completed).
- **Quick Links**: Navigate to Sync Management (`/settings/syrve/sync`) and Integration Testing (`/settings/syrve/testing`).

### 6. AI Recognition (`/settings/ai` -- `AiSettings.tsx`)
- Wine index statistics: total wines, text-indexed count, embedding count (from `wines` table)
- Recognition Pipeline: enable/disable toggle (`is_active`), vision verification toggle, active model badge
- Thresholds: auto-preselect threshold (0-1), rescan suggestion threshold (0-1), rate limit (calls/min)
- Image Policy: max image size (MB)
- API Key: custom API key field, custom gateway URL field. Stored in `ai_config.settings` JSONB. Edge functions (`ai-enrich-wine`, `ai-recognize-label`) check for custom key, fallback to built-in `LOVABLE_API_KEY`.
- Search Index: rebuild button invokes `generate-wine-embeddings` edge function
- All config stored in `ai_config` table (single row)

### 7. Roles & Permissions (`/settings/roles` -- `RolesPermissions.tsx`)
- 9 permission modules with 35+ sub-actions defined in `referenceData.ts`
- 4 permission levels: none, view, edit, full
- Module-level bulk permission setting (sets all sub-actions at once)
- Sub-action individual permission radio buttons
- Built-in roles locked (Super Admin cannot be modified or deleted)
- Custom role creation with name + color picker
- Permission summary badges per role and per module
- Storage: `app_roles_config` table with `permissions` JSONB column
- Hooks: `useRolesConfig()`, `useAddRoleConfig()`, `useRemoveRoleConfig()`, `useSetRolePermission()`, `useSetModulePermissions()`

### 8. User Management (`/users` -- `UserManagement.tsx`)
- Currently uses mock data (`mockUsers`) -- not connected to database
- Search by name/email, filter by role and status, sort by name/login/activity
- User cards with avatar initial, role badge, status badge, activity stats
- Create/Edit dialog (`UserFormDialog.tsx`): name, email, password (with strength meter), role (from `app_roles_config`), status, phone, job title, department, notes
- Edge function `manage-users` exists for server-side user creation via Supabase Auth
- Suspend/Activate and Delete actions are placeholder (not functional)

### 9. Supporting Infrastructure

#### Database Tables
- `app_settings`: key-value store for all global config (RLS: admin manage, auth read)
- `ai_config`: single-row AI pipeline config (RLS: admin manage, auth read)
- `syrve_config`: single-row Syrve connection and import rules (RLS: admin manage, auth read)
- `app_roles_config`: custom roles with JSONB permissions (RLS: admin manage, auth read)
- `glass_dimensions`: glass pour sizes (RLS: admin manage, auth read)
- `locations` + `sub_locations`: hierarchical storage locations (RLS: admin manage, auth read)
- `volume_options`: bottle volume definitions (RLS: admin manage, auth read)
- `stores`: synced from Syrve (RLS: admin manage, auth read)
- `categories`: synced from Syrve (RLS: admin manage, auth read)
- `syrve_sync_runs`: sync execution history (RLS: admin manage, auth read)
- `syrve_api_logs`: API request/response logs (RLS: admin manage)
- `syrve_outbox_jobs`: pending Syrve submissions (RLS: admin manage, auth read)
- `audit_logs`: admin-readable action history (RLS: admin read, auth insert)
- `profiles`: user profile data (RLS: own profile + admin read all)
- `user_roles`: maps users to `app_role` enum (RLS: admin CRUD, users read own)

#### React Hooks
- `useAppSetting(key, default)` / `useUpdateAppSetting()`: generic key-value config
- `useGlassDimensions()`, `useAddGlassDimension()`, `useRemoveGlassDimension()`
- `useLocations()`, `useAddLocation()`, `useRemoveLocation()`, `useAddSubLocation()`, `useRemoveSubLocation()`
- `useVolumes()`, `useAddVolume()`, `useRemoveVolume()`
- `useRolesConfig()`, `useAddRoleConfig()`, `useRemoveRoleConfig()`, `useSetRolePermission()`, `useSetModulePermissions()`
- `useSyrveConfig()`, `useTestSyrveConnection()`, `useSaveSyrveConfig()`, `useSyrveSync()`, `useSyrveStores()`, `useSyrveCategories()`, `useSyrveProducts()`, `useSyrveSyncRuns()`, `useSyrveApiLogs()`, `useSyrveOutboxJobs()`, `useForceStopSync()`, `useToggleTestingMode()`, `useProcessOutbox()`, `useSyrveBarcodeCount()`

#### Edge Functions (Settings-related)
- `syrve-connect-test`: POST -- validates credentials, returns stores + server version + business info
- `syrve-save-config`: POST -- persists connection config with hashed password
- `syrve-sync`: POST -- triggers full or prices_stock sync, creates `syrve_sync_runs` record
- `syrve-process-outbox`: POST -- processes pending outbox jobs
- `syrve-stock-snapshot`: captures stock state
- `ai-recognize-label`: POST -- AI label recognition with custom key fallback
- `ai-enrich-wine`: POST -- AI wine metadata enrichment with custom key fallback
- `generate-wine-embeddings`: POST -- rebuilds vector search index
- `manage-users`: POST -- server-side user creation via Supabase Auth admin API
- `auth-login-username`: POST -- username/password auth for staff

#### Routing Map
| Route | Component | Access |
|-------|-----------|--------|
| `/settings` | `AppSettings` | admin, super_admin |
| `/settings/business` | `BusinessSettings` | admin, super_admin |
| `/settings/general` | `GeneralSettings` | admin, super_admin |
| `/settings/inventory` | `InventorySettings` | admin, super_admin |
| `/settings/syrve` | `SyrveSettings` | admin, super_admin |
| `/settings/syrve/sync` | `SyrveSyncPage` | admin, super_admin |
| `/settings/syrve/testing` | `SyrveTestingPage` | admin, super_admin |
| `/settings/ai` | `AiSettings` | admin, super_admin |
| `/settings/roles` | `RolesPermissions` | settings.full permission |
| `/users` | `UserManagement` | admin, super_admin |

#### Security Model
- All settings tables use RLS with `has_role(auth.uid(), 'admin')` for write operations
- All settings tables allow authenticated SELECT for read access
- Role checking uses `SECURITY DEFINER` function to avoid RLS recursion
- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Password hashing for Syrve credentials is done server-side in edge functions

### 10. Known Gaps / Future Work
- User Management uses mock data; needs migration to real `profiles` + `user_roles` tables
- Database backup/export settings page not implemented
- Notifications settings page not implemented
- `UserFormDialog` save action is client-side only (toast mock); needs `manage-users` edge function integration
- Auto-sync schedule is stored but no cron/scheduler executes it
- Bidirectional sync direction option exists in UI but is not implemented in backend

---

## File to Create

**Path**: `new/Code/settings_module_specification.md`

The document will contain all the above sections with full technical detail, including database schemas, hook signatures, edge function request/response formats, UI component trees, and data flow diagrams.

