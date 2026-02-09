

# Supabase Integration - Full Database Backend

## Overview
Migrate the entire Simply Rest application from mock/in-memory data to a fully persistent Supabase backend. This covers all tables from the provided database schema document, Supabase Auth for login, Storage for images, RLS policies for security, and updating every page/store to use real database calls.

## Prerequisites
The project does not currently have Supabase connected. **Step 0 is to enable Lovable Cloud** (preferred) which will spin up a Supabase instance automatically.

---

## Phase 1: Database Setup (Supabase Migrations)

### Migration 1: Core Enums and Reference Tables
Create PostgreSQL enums and reference tables:
- `wine_type_enum`: red, white, rose, sparkling, fortified, dessert
- `session_status_enum`: draft, in_progress, completed, paused, approved, flagged
- `movement_type_enum`: count_adjustment, sale, purchase, transfer, write_off, correction
- `counting_method_enum`: manual, barcode, image_ai
- `bottle_state_enum`: unopened, opened
- Tables: `suppliers`, `wine_producers`, `grape_varieties`

### Migration 2: Wines Table
Full wines table with all ~80 columns from the document:
- Basic info (name, full_name, producer, estate, producer_slug)
- Classification (wine_type)
- Vintage and aging (vintage, is_non_vintage, bottling_date, release_date, optimal_drinking_start/end, aging_potential_years)
- Geography (country, country_code, region, sub_region, appellation, vineyard, terroir)
- Product details (volume_ml, volume_label, bottle_size, alcohol_content, residual_sugar, total_acidity, ph_level)
- Closure/packaging (closure_type, bottle_color, capsule_type, label_design)
- Pricing (purchase_price, sale_price, retail_price, currency, price_tier, glass_price, glass_pour_size_ml, available_by_glass)
- Stock management (current_stock_unopened, current_stock_opened, min_stock_level, max_stock_level, reorder_point, reorder_quantity, stock_status)
- Internal (sku UNIQUE, internal_code, bin_location, cellar_section, rack_number, shelf_position)
- Supplier info (supplier_id FK, supplier_sku, supplier_name, last_purchase_date/quantity/price)
- Tasting and characteristics (tasting_notes, body, tannins, sweetness, acidity, color_description, nose_aromas, palate_flavors, finish_description)
- Ratings (internal_rating, critic_scores JSONB, wine_advocate_score, wine_spectator_score, etc.)
- Food pairing (food_pairing, food_pairing_tags JSONB, serving_temperature_min/max, decanting_time_minutes)
- Production (production_method, fermentation_vessel, aging_vessel, oak_aging_months, oak_type, oak_toast_level, malolactic_fermentation, cases_produced, etc.)
- Certifications (certifications JSONB, is_organic, is_biodynamic, is_natural, is_vegan, awards JSONB)
- Barcodes (primary_barcode, barcode_type, alternative_barcodes JSONB)
- Marketing (marketing_description, short_description, story, winemaker_name, featured_wine, wine_list_position, wine_list_category)
- Digital (website_url, vivino_url, etc.)
- Metadata (tags JSONB, internal_notes, slug UNIQUE, search_keywords)
- Status (is_active, is_discontinued, is_archived, replacement_wine_id FK)
- Audit (created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
- Grape varieties stored as JSONB array (grape_varieties)

### Migration 3: Wine Related Tables
- `wine_variants` (id, base_wine_id FK, vintage, volume_ml, bottle_state, variant_name, variant_sku, variant_barcode, current_stock, min_stock_level, purchase_price, sale_price, syrve_product_id, is_active, timestamps)
- `wine_barcodes` (id, wine_id FK, barcode, barcode_type, region, distributor, packaging, is_primary, is_active, added_at)
- `wine_images` (id, wine_id FK, image_url, image_path, storage_provider, storage_key, filename, original_filename, mime_type, file_size_bytes, width_px, height_px, image_type, is_primary, display_order, source, captured_during_inventory, inventory_session_id FK, ai_confidence_score, ai_recognition_successful, ocr_text, is_approved, uploaded_by FK, uploaded_at)

### Migration 4: Inventory Management Tables
- `inventory_sessions` (all columns from doc: id, session_name, session_type, description, status, location_filter, wine_filter JSONB, total_wines_expected, total_wines_counted, started_at, completed_at, duration_seconds, started_by FK, completed_by FK, approved_by FK, approved_at, approval_notes, flagged_reason, timestamps)
- `inventory_items` (id, session_id FK, wine_id FK, variant_id FK, expected_quantity_unopened/opened, counted_quantity_unopened/opened, variance_unopened/opened/total as GENERATED columns, count_status, has_variance GENERATED, counted_at, counted_by FK, counting_method, counting_duration_seconds, confidence, location, notes)
- `inventory_movements` (id, session_id FK, wine_id FK, variant_id FK, movement_type, bottle_state, quantity_before, quantity_change, quantity_after, unit_cost, total_value, reason, reference_number, location, recording_method, captured_image_id FK, barcode_scanned, ai_confidence_score, performed_by FK, performed_at)
- `stock_snapshots` (id, snapshot_date, snapshot_time, wine_id FK, stock_unopened, stock_opened, total_stock GENERATED, unit_cost, total_value GENERATED, snapshot_type, triggered_by, session_id FK, created_at)

### Migration 5: User Management
Supabase Auth handles the core auth. Additional tables:
- `profiles` (id FK to auth.users, first_name, last_name, display_name, phone, avatar_url, avatar_color, employee_id, department, job_title, hire_date, is_active, is_locked, failed_login_attempts, last_login_at, language, timezone, preferences JSONB, created_at, updated_at, deleted_at)
- `user_roles` (id, user_id FK to auth.users, role app_role_enum, UNIQUE(user_id, role)) -- following security guidelines
- `app_roles_config` (id, role_name, color, is_builtin, permissions JSONB) -- stores the configurable role definitions
- Trigger: auto-create profile on signup
- Security definer function: `has_role(user_id, role)`

### Migration 6: Audit and Logging Tables
- `audit_logs` (id, user_id FK, action, entity_type, entity_id, entity_name, old_values JSONB, new_values JSONB, changed_fields TEXT[], description, reason, ip_address, success, error_message, performed_at, metadata JSONB)
- `error_logs` (id, error_type, error_code, error_message, error_stack, user_id FK, context JSONB, created_at)
- `system_notifications` (id, user_id FK, title, message, notification_type, related_entity_type, related_entity_id, action_url, is_read, read_at, is_dismissed, priority, created_at)
- `user_activity_log` (id, user_id FK, action, entity_type, entity_id, description, changes JSONB, success, performed_at)

### Migration 7: Settings/Reference Data Tables
- `glass_dimensions` (id, label, volume_litres, is_active, created_at)
- `locations` (id, name, type, is_active, created_at)
- `sub_locations` (id, location_id FK, name, is_active)
- `volume_options` (id, ml, label, bottle_size, is_active)
- `app_settings` (id, key UNIQUE, value JSONB, updated_at, updated_by FK)

### Migration 8: Syrve Integration Tables (future-ready, created empty)
- `syrve_config`, `wine_syrve_product_mappings`, `syrve_sync_logs`, `syrve_writeoff_documents`, `syrve_writeoff_items`, `syrve_webhook_events`

### Migration 9: Indexes
- Composite indexes on wines (wine_type + region), (stock levels), (is_active)
- FK indexes on all child tables
- JSONB GIN indexes on grape_varieties, tags, critic_scores
- Partial indexes on active wines, low stock, pending sessions

### Migration 10: RLS Policies
- `wines`: authenticated users can SELECT; users with edit+ role can INSERT/UPDATE; full role can DELETE (soft delete)
- `profiles`: users can read/update own profile; admins can read all
- `user_roles`: security definer function for checks; admins can manage
- `inventory_sessions`: authenticated can SELECT; users with count permission can INSERT/UPDATE
- `inventory_items`: same as sessions
- `inventory_movements`: authenticated can SELECT; count permission can INSERT
- `audit_logs`: admins can SELECT; system inserts via service role
- `settings tables`: authenticated can SELECT; admins can INSERT/UPDATE/DELETE
- `wine_images`: authenticated can SELECT; edit permission can INSERT/UPDATE
- Storage bucket `wine-images`: authenticated can upload; public can read

### Migration 11: Storage Bucket
- Create `wine-images` bucket (public read)
- RLS: authenticated users can upload to `wine-images`

### Migration 12: Database Functions
- `fn_update_stock_status()`: trigger function to auto-set stock_status based on current_stock vs min_stock_level
- `fn_create_audit_log()`: reusable function to insert audit log entries
- `fn_calculate_session_totals()`: recalculate session totals after item changes
- Trigger on wines: after UPDATE on stock columns, call fn_update_stock_status
- Trigger on profiles: auto-update updated_at

### Seed Data
Using the insert tool (not migrations):
- Insert default glass dimensions, locations, sub-locations, volume options
- Insert default roles (Admin, Staff) into app_roles_config
- Insert default wine regions data into a reference format

---

## Phase 2: Supabase Client Setup

### Create `src/integrations/supabase/client.ts`
- Supabase client initialization with auto-generated types

### Create `src/integrations/supabase/types.ts`
- TypeScript types generated from the database schema matching all tables

---

## Phase 3: Authentication Rewrite

### Update `src/stores/authStore.ts`
- Replace mock login with `supabase.auth.signInWithPassword()`
- Add `signUp()` method
- Use `onAuthStateChange` listener (set up BEFORE `getSession()`)
- Fetch profile + role from `profiles` and `user_roles` tables on login
- Permission checking now queries `app_roles_config` table for role permissions

### Update `src/pages/Login.tsx`
- Wire up to real Supabase Auth
- Handle email/password signup and login
- Show proper error messages

### Add auth guard
- Update `AppLayout.tsx` to redirect to /login if not authenticated
- Use `onAuthStateChange` to handle session changes

---

## Phase 4: Store Rewrites

### `src/stores/settingsStore.ts` --> Supabase-backed
- All CRUD operations (glass dimensions, locations, sub-locations, volumes, roles) call Supabase instead of local state
- Use React Query for caching and invalidation
- Roles: read from `app_roles_config`, write permissions via Supabase

### `src/stores/sessionStore.ts` --> Supabase-backed
- Sessions: CRUD against `inventory_sessions` table
- Items: CRUD against `inventory_items` table
- Audit: write to `audit_logs` table
- approve/flag operations update session + insert audit log

### Remove mock data dependency
- `mockWines`, `mockMovements`, `mockSessions`, `mockInventoryItems`, `mockUsers` will no longer be imported by pages/stores

---

## Phase 5: Page Updates (every page touches Supabase)

### `Dashboard.tsx`
- Fetch wine count, stock stats, recent movements from Supabase
- Real-time low stock alerts from wines where stock_status = 'low_stock'

### `WineCatalog.tsx`
- Paginated query from `wines` table with filters
- Search using ILIKE or full-text search
- Admin-only actions check role via Supabase

### `WineDetail.tsx`
- Fetch single wine by ID from Supabase
- Fetch related movements from `inventory_movements`
- Fetch wine images from `wine_images`

### `WineForm.tsx`
- INSERT or UPDATE wine in Supabase
- Upload images to `wine-images` storage bucket
- Save image reference to `wine_images` table
- Create audit log entry on save

### `ImportInventory.tsx`
- On confirm, batch INSERT wines into Supabase `wines` table
- Create audit log for bulk import
- Duplicate SKU check against existing DB records

### `InventoryCount.tsx`
- Create `inventory_sessions` row on start
- Insert `inventory_items` rows on each count
- Insert `inventory_movements` on count
- Update wine stock levels in `wines` table
- Upload scanned images to storage

### `CurrentStock.tsx`
- Query wines with stock columns from Supabase
- Respect stock permission RLS

### `InventoryHistory.tsx`
- Query `inventory_movements` with joins to wines and users
- Paginated, filterable

### `SessionReview.tsx`
- Query `inventory_sessions` with status filters
- Approve/flag updates + audit log writes

### `UserManagement.tsx`
- Query `profiles` joined with `user_roles`
- Create users via Supabase Auth admin (edge function)
- Update roles in `user_roles` table

### `GeneralSettings.tsx`
- CRUD glass_dimensions, locations, sub_locations, volume_options tables

### `RolesPermissions.tsx`
- CRUD `app_roles_config` table
- Update permissions JSONB

### `Reports.tsx`
- Aggregate queries on wines, movements, sessions
- Stock valuation from wines table

### `Profile.tsx`
- Read/update own profile from `profiles` table
- Upload avatar to storage

---

## Phase 6: Edge Functions

### `supabase/functions/create-user/index.ts`
- Admin-only edge function to create new users via Supabase Auth Admin API
- Creates profile + assigns role
- Called from UserManagement page

### `supabase/functions/bulk-import-wines/index.ts`
- Accepts array of wine objects from CSV import
- Validates and batch inserts into wines table
- Returns success/error counts
- Creates audit log entry

---

## Phase 7: React Query Integration

### Create custom hooks in `src/hooks/`
- `useWines(filters)` - paginated wine list
- `useWine(id)` - single wine with images and movements
- `useInventorySessions(filters)` - session list
- `useInventoryItems(sessionId)` - items for a session
- `useMovements(filters)` - movement history
- `useProfiles()` - user list for admin
- `useSettings()` - glass dimensions, locations, volumes
- `useRoles()` - role configurations
- `useNotifications()` - user notifications
- `useDashboardStats()` - aggregated dashboard data

All hooks use `@tanstack/react-query` for caching, refetching, and optimistic updates.

---

## Phase 8: Real-time Subscriptions (optional enhancement)
- Subscribe to `inventory_sessions` changes for live session status updates
- Subscribe to `system_notifications` for in-app notifications

---

## Files to Create (new)
1. Multiple SQL migration files (12+)
2. `src/integrations/supabase/client.ts`
3. `src/integrations/supabase/types.ts`
4. `src/hooks/useWines.ts`
5. `src/hooks/useWine.ts`
6. `src/hooks/useInventorySessions.ts`
7. `src/hooks/useInventoryItems.ts`
8. `src/hooks/useMovements.ts`
9. `src/hooks/useProfiles.ts`
10. `src/hooks/useSettings.ts`
11. `src/hooks/useRoles.ts`
12. `src/hooks/useDashboardStats.ts`
13. `src/hooks/useNotifications.ts`
14. `supabase/functions/create-user/index.ts`
15. `supabase/functions/bulk-import-wines/index.ts`

## Files to Modify (existing)
1. `src/stores/authStore.ts` - Supabase Auth
2. `src/stores/settingsStore.ts` - Supabase queries
3. `src/stores/sessionStore.ts` - Supabase queries
4. `src/pages/Login.tsx` - Real auth
5. `src/pages/Dashboard.tsx` - DB queries
6. `src/pages/WineCatalog.tsx` - DB queries
7. `src/pages/WineDetail.tsx` - DB queries
8. `src/pages/WineForm.tsx` - DB mutations + storage
9. `src/pages/ImportInventory.tsx` - DB batch insert
10. `src/pages/InventoryCount.tsx` - DB mutations
11. `src/pages/CurrentStock.tsx` - DB queries
12. `src/pages/InventoryHistory.tsx` - DB queries
13. `src/pages/SessionReview.tsx` - DB mutations
14. `src/pages/UserManagement.tsx` - DB + edge function
15. `src/pages/GeneralSettings.tsx` - DB CRUD
16. `src/pages/RolesPermissions.tsx` - DB CRUD
17. `src/pages/Reports.tsx` - DB aggregates
18. `src/pages/Profile.tsx` - DB + storage
19. `src/components/AppLayout.tsx` - Auth guard
20. `src/components/AppSidebar.tsx` - Real user data

## Execution Order
Due to the massive scope, implementation will proceed in this order:
1. Enable Lovable Cloud / Supabase connection
2. Run all migrations (schema first)
3. Seed reference data
4. Set up Supabase client + types
5. Auth rewrite (login must work first)
6. Settings store (needed by many pages)
7. Wine CRUD (catalog, detail, form, import)
8. Inventory (count, sessions, movements, stock)
9. User management + edge functions
10. Dashboard, Reports, History
11. Audit logging throughout
12. Storage for images

