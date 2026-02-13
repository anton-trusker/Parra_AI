Below is a **clean, complete page structure** for your Wine Inventory app, aligned with the knowledge base:

* **Syrve is source of truth** (catalog + structure; no create/edit items/groups in your app)
* Your app is the **inventory workflow + enrichment layer** (images, AI recognition, glass/bottle rules, counting history, sessions, sync outbox)
* Includes both **Admin/Desktop** and **Staff/Mobile** flows

---

# 1) Navigation model (top-level)

## A) Staff / Mobile navigation (primary)

Designed for “count fast”:

1. **Start / Continue Inventory**
2. **Scan / Count**
3. **My Counts**
4. **Help / Rules**

## B) Admin / Manager navigation (desktop/tablet)

Designed for “configure + review + sync”:

1. **Dashboard**
2. **Inventory Sessions**
3. **Catalog**
4. **Reports**
5. **Settings**
6. **Logs**

This matches the “Key Pages” concept already listed (Dashboard, Wine Catalog, Wine Detail, Inventory Count) and expands it into production-grade IA.

---

# 2) Full page tree (routes) + purpose

## 2.1 Auth & onboarding

### `/login`

* Email/password + magic link (Supabase Auth)

### `/onboarding`

* First-time business setup (business name, locale)
* Creates `business_profile`, `business_settings`, assigns owner role

### `/invite/:token`

* Accept invite to business, assign role

*(These are implied by the SaaS multi-tenancy + profiles/roles model.)*

---

## 2.2 Dashboard

### `/dashboard`

**Admin/Manager home**

* Stats: total products/wines, low stock, last session status
* Quick actions: “Start inventory”, “Sync Syrve”, “Review pending”
  This aligns with Phase 5 “Dashboard” as a key page. 

---

## 2.3 Inventory (core feature)

### `/inventory`

**Sessions list**

* Filters: status, store, date, created_by
* Quick: “New session”

### `/inventory/new`

**Create session wizard**

1. Select store (Syrve store) 
2. Select scope: all categories vs selected (if you support “import only selected categories”)
3. Baseline load: fetch current stock snapshot from Syrve (Edge Function)
4. Confirm start

### `/inventory/:sessionId`

**Session overview**

* Status timeline: draft → in_progress → pending_review → approved → synced 
* Staff progress: total items counted, last activity
* CTA by role:

  * Staff: “Continue counting”
  * Manager: “Review variances”, “Send to Syrve”

### `/inventory/:sessionId/count`

**Counting UI (mobile-first)**

* Tabs: Scan (barcode / AI image), Search, Recently counted
* Product list + quick add (enter bottles + open ml)
* “Add” writes **events** (no overwrites), supports multi-user
* This corresponds to the “Inventory Count” feature and counting store logic in Phase 4.

### `/inventory/:sessionId/my-counts`

**My counts**

* List of user’s `inventory_count_events`
* Undo / correction rules (optional: append negative adjustment event)

### `/inventory/:sessionId/review`

**Manager review page**

* Variance table: expected vs counted (liters) + differences
* Filters: shortage/excess, large diffs, missing items
* Inline adjust (creates manager_adjustment events)
* “Recompute variances” action (server-side)
  Matches the “variance calc + manager approval required” logic in DB docs.

### `/inventory/:sessionId/submit`

**Submit to Syrve (manager only)**

* Step 1: Validate document (`check/incomingInventory`)
* Step 2: If valid → Send (`import/incomingInventory`)
* Show Syrve response: variances and totals (`differenceAmount`, `differenceSum`) 
* Stores XML and response in outbox/log tables

---

## 2.4 Catalog (Syrve-synced + app-enriched)

### `/catalog`

**Product catalog**

* Search + filters (category/type/active/has image/served by glass)
* Read-only for Syrve fields
  This is Phase 5 “Wine Catalog”. 

### `/catalog/:productId`

**Product detail**
Sections:

1. Syrve snapshot (read-only): id, sku, unit, category, etc.
2. Enrichment: images, wine profile fields, tags, notes
3. Serving rules: bottle size, sold by glass, glass mapping
4. History: inventory sessions & count history
   This matches Phase 5 “Wine Detail” and your “enrichment + history” requirement.

### `/catalog/:productId/images`

* Manage images (upload, set primary)
* Link images to AI recognition improvements

### `/catalog/:productId/rules`

* Configure serving rules (product overrides)

---

## 2.5 Reports (manager-facing)

### `/reports`

Report hub:

* Inventory variance summary by period
* Value of shortage/excess (if pricing is available)
* Counting speed & accuracy (AI success rate)

### `/reports/inventory/:sessionId`

* Exportable session report PDF/CSV (later)
* Includes Syrve validation result + internal audit

*(Reports are implied by “documents/logs/reporting”, and supported by session + snapshot tables.)*

---

## 2.6 Settings (admin)

### `/settings`

Settings index

### `/settings/business`

* Business profile: name, currency, language, timezone

### `/settings/users`

* Invite users, set roles (owner/admin/manager/staff)

### `/settings/inventory`

* Approval required toggle
* Default bottle size
* Default glass size
* Rules behavior (e.g., allow negative adjustments)

### `/settings/serving`

* Manage glass dimensions & bottle sizes
* Default mapping per category

### `/settings/syrve`

**Syrve Connection page (critical)**

* Test connection → show stores list
* Choose store
* Save config (encrypted password)
* Sync products now
  This is explicitly documented with route: **Settings → Syrve Connection (`/settings/syrve`)**.

### `/settings/syrve/sync`

* Manual “Sync now” + sync history
* Show counts: categories/products created/updated/deactivated 

---

## 2.7 Logs & diagnostics (admin/manager)

### `/logs`

* Tabs: Sync runs, API logs, outbox, errors

### `/logs/syrve-sync`

* `syrve_sync_runs` list + details

### `/logs/syrve-api`

* Request/response history (redacted)

### `/logs/outbox`

* Pending/failed jobs; retry button

### `/logs/errors`

* Application errors by severity

This matches the integration docs emphasis on logging and validation/error handling.

---

# 3) Page-to-database mapping (so dev knows exactly what to query)

## Dashboard

* `products`, `wines` (if you keep wine extension), low-stock view
* recent `inventory_sessions`

## Inventory create/start

* Read Syrve via Edge Function, write:

  * `inventory_sessions`
  * `inventory_baseline_items`
  * optional `stock_snapshots`

## Inventory counting

* Read `products` + enrichment (images/rules)
* Insert `inventory_count_events` (append-only)

## Review

* Read `inventory_product_aggregates`
* Manager-only read `inventory_baseline_items`
* Call recompute variances function (if used)

## Submit to Syrve

* Create outbox job, call Edge Function
* Store Syrve validation results

## Catalog detail

* Read `products.syrve_data` + `wines` + `product_assets` + `product_serving_rules`

---

# 4) Recommended “MVP vs Next” page split (so you don’t overbuild)

## MVP pages you absolutely need

* `/dashboard` 
* `/settings/syrve` (+ `/settings/syrve/sync`)
* `/catalog` and `/catalog/:id` 
* `/inventory`, `/inventory/new`, `/inventory/:id/count`, `/inventory/:id/review`, `/inventory/:id/submit`
* `/settings/users`

#

