
# Wine Inventory Platform - Phased Implementation Plan

This plan breaks the full product documentation into 8 sequential phases, each delivering a working increment. Each phase builds on the previous one.

---

## Phase 1: Real Authentication and User Management ✅ DONE

**Status**: Complete
- Supabase Auth with email + username login (synthetic email pattern)
- Edge Functions: `auth-login-username`, `manage-users`
- Profile management, role-based route guards
- Permission hooks (`useIsAdmin`, `useHasPermission`)

---

## Phase 2: Settings, Business Profile, and Reference Data Migration ⚠️ PARTIALLY DONE

**Status**: Core settings migrated, business profile and advanced settings pages missing

### ✅ Completed
- `GeneralSettings.tsx` fully DB-backed via React Query hooks (`useGlassDimensions`, `useLocations`, `useVolumes`, `useAppSettings`)
- `RolesPermissions.tsx` using `app_roles_config` table
- `settingsStore.ts` can be deprecated — all General Settings now use React Query

### 🔴 Remaining (Priority Order)

#### 2a. Settings Home Upgrade (`/settings`)
- Configuration health cards: Syrve status, last sync, user count, AI recognition status
- Priority alerts: Syrve not connected, no products synced, store not selected
- Quick actions: Test connection, Sync products, Create staff
- Source: Spec §3

#### 2b. Business Settings Page (`/settings/business`)
- Business name, legal name, address, country, city
- Locale: language, currency, timezone
- Operational defaults: default bottle size, default glass size
- All stored in `app_settings` table with keys like `business_name`, `currency`, `timezone`
- Source: Spec §4

#### 2c. Inventory Rules Page (`/settings/inventory`)
- Session rules: approval required toggle, allow counting after end, negative corrections
- Baseline rules: source display, test baseline pull button
- Units & conversions display
- Variance thresholds: require review if abs(diff) > threshold
- All stored in `app_settings` table
- Source: Spec §7

#### 2d. AI Recognition Settings (`/settings/ai`)
- Recognition enabled toggle
- Vision verification enabled toggle (cost control)
- Auto-preselect threshold, variant selection threshold, rescan threshold
- Image policy: max size, JPEG quality
- Uses existing `ai_config` table
- Source: Spec §10

#### 2e. Data & Export Page (`/settings/data`)
- Rebuild embeddings index button (calls `generate-wine-embeddings`)
- Export configuration JSON
- Source: Spec §11

#### 2f. Deprecate settingsStore.ts
- Remove Zustand store for settings (all data now in DB)
- Update any remaining consumers to use React Query hooks
- Clean up `referenceData.ts` defaults (keep as fallbacks only)

---

## Phase 3: Syrve Integration ✅ DONE

**Status**: Complete
- Connection, test, store selection, category filter
- Hash-based incremental sync with `syrve_raw_objects`
- Outbox processing for inventory submissions
- Sync history, stats cards, outbox management UI
- Edge Functions: `syrve-connect-test`, `syrve-save-config`, `syrve-sync`, `syrve-process-outbox`

---

## Phase 4: Wine Enrichment Layer ⚠️ PARTIALLY DONE

**Status**: Basic wine detail page exists, enrichment editing incomplete

### Remaining
- Enrichment editor within `/catalog/:id` (producer, region, vintage, tasting notes)
- Images tab (gallery, upload, set primary) — `wine_images` table exists
- Serving rules editor (sold by glass toggle, glass dimension picker)
- Variants tab (link products in same wine family) — `wine_variants` table exists
- Syrve tab (read-only JSON viewer of `syrve_data`)

---

## Phase 5: Event-Sourced Inventory System ⚠️ PARTIALLY DONE

**Status**: Basic session/items flow exists, event sourcing not implemented

### Remaining
- Convert to append-only `inventory_count_events` model
- Immutable baseline items from Syrve
- Materialized aggregates with trigger functions
- Staff per-user virtual table
- Session phases: draft → active → pending_review → approved → submitted
- Submit-to-Syrve workflow (check → commit via outbox)

---

## Phase 6: AI Label Recognition Pipeline ✅ CORE DONE

**Status**: OCR + hybrid matching (trigram + vector + ILIKE) implemented

### Remaining
- Auto-capture UX improvements (frame stability detection)
- Variant selector when vintage not detected
- AI settings page (Phase 2d above)
- Label library coverage monitoring

---

## Phase 7: Dashboard, Reports, and Logs

**Status**: Not started (mock data)

### Tasks
- Dashboard with real data cards (active session, last sync, recognition health)
- Reports with date range filters, session variance summaries, CSV export
- Logs page: Sync Runs, API Logs, Outbox, Errors

---

## Phase 8: Onboarding, Polish, and Mobile Optimization

**Status**: Not started

### Tasks
- Onboarding wizard (business profile setup)
- Mobile bottom nav optimization by role
- Offline detection, loading skeletons, error drawers
- PWA enhancements
- Security hardening review

---

## Current Priority: Phase 2 Remaining Items

The next implementation sprint should focus on:
1. **Settings Home upgrade** — health cards and alerts (high impact, low effort)
2. **Business Settings page** — foundational for locale/currency across app
3. **Inventory Rules page** — needed before Phase 5 event-sourced inventory
4. **AI Settings page** — needed to control Phase 6 recognition pipeline
5. **settingsStore deprecation** — technical debt cleanup

---

## Architecture Notes

- All settings use `app_settings` table (key-value JSONB) via `useAppSetting` / `useUpdateAppSetting` hooks
- Reference data tables: `glass_dimensions`, `locations`, `sub_locations`, `volume_options`, `app_roles_config`
- AI config uses dedicated `ai_config` table (singleton)
- Syrve config uses dedicated `syrve_config` table (singleton)
- `settingsStore.ts` is legacy Zustand — should be removed once all consumers migrate to React Query
- Edge functions handle all Syrve API calls (never from frontend)
- AI uses Lovable Cloud built-in models (Gemini) — no external API keys required for OCR/vision
