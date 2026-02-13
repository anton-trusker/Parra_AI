# Supabase Integration (Inventory AI + Syrve) — Overview

## Scope
This document describes the **complete Supabase integration** for the Inventory AI product:

- Supabase **Auth** (supports **email login** OR **login name + password**)
- Supabase **Postgres** schema (single client platform)
- Supabase **RLS** and permissions model
- Supabase **Storage** (label images + evidence images)
- Supabase **Edge Functions** (Syrve integration, inventory export, AI recognition)

## Core principles
- **Single client platform**: one restaurant/business per Supabase project
- **Syrve is source of truth** for:
  - organization structure (departments / stores)
  - catalog (categories, products)
  - baseline stock snapshot at inventory start
- **Our app is source of truth** for:
  - enrichment (wine fields, label library, serving rules)
  - AI recognition runs and feedback
  - inventory sessions and all counting history
  - export jobs and audit logs

## Current project code alignment (important)
The current frontend already uses Supabase client (`src/integrations/supabase/client.ts`) and expects:

- Pages/routes in `src/App.tsx`:
  - `/login`, `/dashboard`, `/catalog/*`, `/count`, `/sessions`, `/settings/syrve`, `/settings/roles`, `/users`
- Username login currently implemented as **synthetic email**:
  - `authStore.login()` does `email = `${loginName}@inventory.local`` then `supabase.auth.signInWithPassword({ email, password })`

This spec keeps that pattern **compatible**, while also allowing real email.

## Data flow: Setup → Sync → Inventory → Export

### 1) Admin Setup (first manager)
1. Create Supabase Auth user (`auth.users`) for manager
2. Create `profiles` row linked to `auth.users.id`
3. Assign role in `user_roles` (typically `manager`)

### 2) Syrve connection
- Manager enters Syrve server URL + login + password
- Client calls Edge Function `syrve-connect-test`
- If OK → client saves config (Edge Function `syrve-save-config`)

### 3) Bootstrap Sync
Edge Function `syrve-bootstrap-sync` performs:
- Departments/org nodes
- Stores
- Categories
- Products (+ barcodes)
- Writes raw payloads to `syrve_raw_objects` (mirror)
- Writes canonical rows to `org_nodes`, `stores`, `categories`, `products`, `product_barcodes`
- Logs run to `syrve_sync_runs`

### 4) Inventory session lifecycle
1. Manager creates session in `inventory_sessions` (draft)
2. Start session:
   - Pull baseline from Syrve stock endpoint
   - Write immutable snapshot to `inventory_baseline_items`
   - Move session to `in_progress`
3. Staff counting:
   - App inserts **append-only** `inventory_count_events`
   - Trigger updates `inventory_product_aggregates`
4. Manager review:
   - Manager reads baseline + aggregates + variances
   - Adjustments are **new events** (method=`manager_adjustment`)
   - Manager sets session `approved`
5. Export to Syrve:
   - Create `syrve_outbox_jobs` with payload XML hash
   - Worker Edge Function processes outbox:
     - syrve check (optional) + import
     - stores responses
   - Session becomes `synced`

## Why “count events” instead of mutable `inventory_items`
The older SQL migration in `doc/new/db/20240101000008_create_inventory_tables.sql` uses a mutable `inventory_items` row per (session, product, location). This breaks under concurrency because:
- two staff members counting the same product will overwrite or require locking

This spec uses:
- `inventory_count_events` (append-only)
- `inventory_product_aggregates` (fast totals)

This matches your newer product documentation and Syrve integration guidance.

## Storage buckets
Recommended Supabase Storage buckets:
- `product-labels` (private)
  - confirmed label library images
- `inventory-evidence` (private)
  - per-session evidence images

Access pattern:
- private bucket + signed URLs
- DB table `media_assets` stores `{bucket, path, hash, metadata...}`

## Deliverables in this spec
- Database schema: see `02-database-schema-tables-relations.md`
- Auth + RLS + roles: see `03-auth-rls-permissions.md`
- Edge Functions + Syrve jobs: see `04-edge-functions-syrve-sync-jobs.md`
