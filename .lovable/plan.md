

# Wine Inventory Platform - Phased Implementation Plan

This plan breaks the full product documentation into 8 sequential phases, each delivering a working increment. Each phase builds on the previous one.

---

## Phase 1: Real Authentication and User Management

**Goal**: Replace mock auth with real Supabase Auth, supporting both email and username login.

**Database changes**:
- Update `profiles` table to add `login_name` column (unique) for username-based login
- Create `business_profile` singleton table (name, currency, language, timezone)
- Update `app_roles_config` to align with PRD role structure (add `is_super_admin` flag)
- Seed default roles: Super Admin, Manager, Staff, Viewer

**Edge Functions**:
- `auth-login-username`: Synthetic email pattern (`{username}@inventory.local`) login
- `manage-users`: Create/update/deactivate users with role assignment (service role)

**Frontend changes**:
- Rewrite `Login.tsx` with real email/password and username/password form
- Rewrite `authStore.ts` to use Supabase Auth (`onAuthStateChange`, `getSession`)
- Add route guards (redirect unauthenticated users to `/login`)
- Update `UserManagement.tsx` to create users via edge function
- Wire `Profile.tsx` to real profiles table
- Add permission-checking hooks using real roles from database

**Pages**: `/login`, `/profile`, `/users`

---

## Phase 2: Settings, Business Profile, and Reference Data Migration

**Goal**: Move all settings from Zustand stores to the database so they persist across sessions.

**Database changes**:
- Create `bottle_sizes` table
- Verify and seed `glass_dimensions`, `volume_options`, `locations`, `sub_locations` tables
- Populate `app_settings` with inventory config (approval_required, default_bottle_size, etc.)

**Frontend changes**:
- Create React Query hooks for all settings tables (`useGlassDimensions`, `useLocations`, `useVolumes`, `useAppSettings`, `useBusinessProfile`)
- Rewrite `GeneralSettings.tsx` to CRUD against database tables instead of Zustand
- Rewrite `RolesPermissions.tsx` to use `app_roles_config` table
- Rewrite `settingsStore.ts` to be a thin cache over React Query data
- Add `/settings/business` page for business profile editing

**Pages**: `/settings/general`, `/settings/business`, `/settings/roles`

---

## Phase 3: Syrve Integration (Connection, Sync, and Catalog)

**Goal**: Connect to Syrve Server API, sync catalog data, and display synced products.

**Database changes**:
- Create `syrve_config` singleton table
- Create `syrve_raw_objects` table (lossless mirror)
- Create `syrve_sync_runs` table
- Create `syrve_api_logs` table
- Create `syrve_outbox_jobs` table
- Create `stores` table (Syrve stores)
- Create `categories` table (Syrve product groups, hierarchical)
- Create `products` table (canonical Syrve products)
- Create `product_barcodes` table
- Add appropriate RLS policies and indexes

**Edge Functions**:
- `syrve-connect-test`: Test Syrve credentials, return stores list
- `syrve-save-config`: Encrypt and save Syrve connection settings
- `syrve-bootstrap-sync`: Full initial catalog sync (departments, stores, groups, products)
- `syrve-sync-products`: Incremental product sync with hash-based change detection

**Frontend changes**:
- Create `/settings/syrve` page (credentials form, test connection, store selector)
- Create `/settings/syrve/sync` page (sync buttons, sync runs table, status panel)
- Rewrite `/catalog` to read from `products` table (with category joins)
- Rewrite `/catalog/:id` to show Syrve data + enrichment tabs

**Pages**: `/settings/syrve`, `/settings/syrve/sync`, `/catalog`, `/catalog/:id`

---

## Phase 4: Wine Enrichment Layer

**Goal**: Add wine-specific metadata, images, and serving rules on top of Syrve products.

**Database changes**:
- Create `wines` enrichment table (1:1 with products, for producer/vintage/region/tasting)
- Create `product_serving_rules` table (glass pour config per product or category)
- Create `product_traits` table (tags, certifications)
- Create `media_assets` table (media file metadata)
- Create `product_assets` junction table (link media to products)
- Create additional storage buckets: `product-labels` (private), `ai-scans` (private)

**Frontend changes**:
- Build enrichment editor within `/catalog/:id` (Overview tab: producer, region, vintage, notes)
- Build Images tab (gallery, upload, set primary)
- Build serving rules editor (sold by glass toggle, glass dimension picker)
- Build Variants tab (link products in same wine family)
- Build Syrve tab (read-only JSON viewer of `syrve_data`)

**Pages**: `/catalog/:id` (tabs: Overview, Images, Variants, History, Syrve)

---

## Phase 5: Event-Sourced Inventory System

**Goal**: Implement the full inventory session workflow with event sourcing.

**Database changes**:
- Create `inventory_baseline_items` table (immutable expected stock)
- Create `inventory_count_events` table (append-only counting log)
- Create `inventory_product_aggregates` table (materialized totals)
- Create `inventory_variances` view (computed differences)
- Create `refresh_product_aggregate()` trigger function
- Create `refresh_inventory_aggregates()` maintenance function
- Update `inventory_sessions` to add `store_id`, `baseline_source`, `baseline_taken_at`, `syrve_document_id` columns
- Add strict RLS: baseline visible only to managers, count events append-only for staff

**Edge Functions**:
- `inventory-create-session`: Create session with store selection
- `inventory-load-baseline`: Pull expected stock from Syrve into baseline items
- `inventory-submit-to-syrve`: Build XML payload, create outbox job
- `syrve-process-outbox`: Background processor for pending outbox jobs

**Frontend changes**:
- Create `/inventory` sessions list page (filters, status badges)
- Create `/inventory/new` session wizard (select store, scope, load baseline, start)
- Rewrite `/inventory/:id` session overview (timeline, progress, staff activity)
- Rewrite counting UI (`/inventory/:id/count`) to insert `inventory_count_events`
- Create `/inventory/:id/my-counts` (staff's own entries, correction events)
- Create `/inventory/:id/review` (manager variance table with summary cards)
- Create `/inventory/:id/submit` (validate and submit to Syrve stepper)

**Pages**: `/inventory`, `/inventory/new`, `/inventory/:id`, `/inventory/:id/count`, `/inventory/:id/my-counts`, `/inventory/:id/review`, `/inventory/:id/submit`

---

## Phase 6: AI Label Recognition Pipeline

**Goal**: Implement the OCR + embedding + vision verification pipeline for wine label scanning.

**Database changes**:
- Create `ai_config` singleton table
- Create `ai_runs` table (recognition audit trail)
- Create `ai_match_candidates` table
- Create `ai_feedback` table
- Create `product_search_index` table with pgvector (1536-dim embeddings)
- Create `vector_search_products()` RPC function
- Enable `pgvector` extension

**Secrets required**:
- The PRD mentions Google Vision and OpenAI, but Lovable Cloud provides built-in AI models (Gemini). We will use Lovable AI for OCR (Gemini 2.5 Flash) and vision verification (Gemini 2.5 Pro), eliminating the need for separate Google Vision and Gemini API keys. For embeddings, we can use the Lovable AI gateway as well.

**Edge Functions**:
- `ai-scan`: Main recognition pipeline (OCR, embedding search, vision verification)
- `ai-reindex-products`: Rebuild product search index embeddings
- `ai-compute-label-hash`: Compute perceptual hash for label matching

**Frontend changes**:
- Upgrade `CameraScanner.tsx` with auto-capture logic (stability detection)
- Add confirmation screen (Confirm, Choose Variant, Rescan, Manual Search)
- Add variant selector modal (when vintage not detected)
- Build `/settings/ai` page (enable/disable recognition, confidence thresholds)
- Integrate AI scan results into counting workflow

**Pages**: `/settings/ai`, updated counting UI

---

## Phase 7: Dashboard, Reports, and Logs

**Goal**: Build manager-facing analytics, reports, and operational logs.

**Database changes**:
- Create `inventory_session_summary` materialized view
- Add indexes for reporting queries

**Frontend changes**:
- Rewrite `/dashboard` with real data cards (active session, last sync, recognition health, inventory summary)
- Rewrite `/reports` with date range filters, session variance summaries, CSV export
- Create `/logs` page with tabs: Sync Runs, API Logs, Outbox, Errors
- Create `/logs/syrve-sync`, `/logs/syrve-api`, `/logs/outbox`, `/logs/errors` sub-pages

**Pages**: `/dashboard`, `/reports`, `/logs` (with sub-tabs)

---

## Phase 8: Onboarding, Polish, and Mobile Optimization

**Goal**: First-time setup wizard, mobile-optimized navigation, and production hardening.

**Frontend changes**:
- Create `/onboarding` wizard (business profile setup, manager account creation)
- Create `/invite/:token` page for accepting team invitations
- Optimize mobile bottom navigation by role (Staff vs Manager)
- Add offline detection banner
- Add loading skeletons and error drawers
- Add confirmation modals for destructive actions
- System notifications panel (from `system_notifications` table)
- PWA enhancements (manifest, service worker caching)

**Security hardening**:
- Review all RLS policies
- Add rate limiting to edge functions
- Ensure Syrve credentials are vault-encrypted
- Add audit logging for sensitive actions

**Pages**: `/onboarding`, `/invite/:token`

---

## Summary: Phase Dependencies

```text
Phase 1 (Auth)
  |
Phase 2 (Settings to DB)
  |
Phase 3 (Syrve Connection + Catalog)
  |
Phase 4 (Wine Enrichment)      Phase 5 (Event-Sourced Inventory)
  |                                |
  +----------+--------------------+
             |
Phase 6 (AI Recognition)
             |
Phase 7 (Dashboard + Reports + Logs)
             |
Phase 8 (Onboarding + Polish + Mobile)
```

Each phase is designed to be independently testable. Phases 4 and 5 can be worked on in parallel since they depend on Phase 3 but not on each other.

---

## Technical Notes

- All mock data files (`mockWines.ts`, `referenceData.ts` defaults) will be replaced by database queries incrementally.
- The `settingsStore.ts` and `authStore.ts` will be refactored from Zustand-only to Zustand + React Query (database-backed).
- Edge functions will follow the CORS pattern required for web apps.
- Syrve API calls are always proxied through edge functions (never from frontend).
- AI features will leverage Lovable Cloud's built-in AI models where possible, avoiding extra API key requirements.
- The existing `wines` table has many columns that overlap with the PRD's separate `products` + `wines` enrichment model. Migration will map existing wine data to the new schema.

