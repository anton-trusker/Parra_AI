# Admin Settings – Full Specification (Manager)

## Document Purpose
This document fully specifies **all Settings pages** for the platform’s **restaurant admin (Manager)**, including:
- Pages and navigation
- UI flows and edge cases
- Roles and access rights
- Syrve connection + sync rules
- Inventory rules & calculations
- Glasses tables and mapping to categories/products
- Product enrichment settings (wine-first)
- AI recognition settings (OCR + label variants)
- Requirements, validations, and backend dependencies

> **Context:** Syrve Server API is the **source of truth** for catalog entities. Our platform does **not** create/update Syrve items/groups. Our platform manages enrichment and inventory workflows.

---

# 1) Settings IA (Information Architecture)

## 1.1 Settings Home
- `/settings`

## 1.2 Settings Sections
1) Business
- `/settings/business`

2) Users & Roles
- `/settings/users`
- `/settings/roles` (capabilities matrix / optional)

3) Syrve Integration
- `/settings/syrve`
- `/settings/syrve/sync`
- `/settings/syrve/mapping` (optional advanced)

4) Inventory Rules
- `/settings/inventory`
- `/settings/inventory/approval`
- `/settings/inventory/baseline`

5) Serving Rules
- `/settings/serving/glasses`
- `/settings/serving/mapping`
- `/settings/serving/bottle-sizes`

6) Product Enrichment Defaults
- `/settings/enrichment`

7) AI Recognition
- `/settings/ai`
- `/settings/ai/label-library` (optional)

8) Data & Export
- `/settings/data`

9) Diagnostics
- `/settings/diagnostics` (links to logs screens)

---

# 2) Access, Roles, and Visibility

## 2.1 Roles
- **Super_admin** (platform owner)
  - Can access any tenant and all settings
  - Not visible to tenant users (no listing in Users page)

- **Manager** (tenant admin)
  - Full access to Settings
  - Can manage staff accounts, inventory rules, integrations

- **Staff**
  - No access to Settings
  - Only operational pages (active session, scan, my counts)

## 2.2 Permission enforcement
- UI gating by role
- Server-side enforcement via RLS + Edge Functions using service role

---

# 3) Settings Home

## 3.1 `/settings`

### Purpose
- Single overview of configuration health
- Shortcuts to critical actions

### UI Blocks
**A) Configuration Health Cards**
1) Syrve Connection
- Status badge: Connected / Disconnected
- Store selected: name
- CTA: “Open Syrve settings”

2) Last Sync
- last_sync_at
- last status: success/failed
- CTA: “Run sync now”

3) Inventory Rules
- approval required: yes/no
- baseline source: Syrve snapshot

4) Recognition
- enabled: yes/no
- vision verification: on/off
- label library coverage: #products with label images

5) Users
- #staff
- last activity
- CTA: “Create staff”

**B) Alerts** (priority ordered)
- Syrve not connected
- Store not selected
- No products synced
- No label images
- Inventory rules missing (default bottle size not set)

**C) Quick Actions**
- Test Syrve connection
- Sync products
- Create staff
- Start inventory session

### Requirements
- Must load in <2s typical
- Alerts must be actionable and link to correct page

---

# 4) Business Settings

## 4.1 `/settings/business`

### Purpose
Configure tenant identity and business defaults.

### UI Structure
**Section A: Business profile**
- Business name
- Legal name (optional)
- Address (optional)
- Country
- City

**Section B: Locale**
- Language (default)
- Currency (default)
- Timezone (default)

**Section C: Operational defaults**
- Default bottle size (ml) (used for liters conversion fallback)
- Default glass size (ml)

### User Flow
1) Manager edits fields
2) Click Save
3) Show toast “Saved”

### Validation
- Business name required
- Currency must be ISO-like (EUR/USD)
- Timezone must be valid IANA string
- Default bottle size must be positive numeric

### Backend
- Updates `business_profile` and `business_settings`

---

# 5) Users & Roles

## 5.1 `/settings/users`

### Purpose
Create and manage staff accounts.

### UI Structure
**A) Users Table**
Columns:
- Name
- Login (username)
- Role (Manager/Staff)
- Status (Active/Disabled)
- Last login (optional)
- Actions (…): Reset password, Disable, Change role

**B) Actions**
- Button: “Create user”
- Button: “Bulk create” (optional)

**C) Create User Modal**
Fields:
- Full name
- Login (username)
- Password (set by manager)
- Role: Staff / Manager (Manager creation optional and may require confirmation)

**D) Reset Password Modal**
- New password
- Confirm

### User Flows

#### Flow: Create Staff
1) Manager → Create user
2) Enters name/login/password/role
3) Save
4) System creates auth user + profile + role
5) Show success + copy credentials button

#### Flow: Disable User
1) Manager selects Disable
2) Confirm modal
3) User cannot log in

#### Flow: Change Role
1) Manager selects Change Role
2) Choose Staff/Manager
3) Confirm
4) Role updated; session permissions change

### Requirements
- **Auth is login/password (username), not email-based**
- Login must be unique within business (or globally—choose one rule)
- Manager can create users without email
- Staff cannot see Users page

### Security/Validation
- Password min length, complexity rule
- Rate limit login attempts
- Audit log for create/disable/role change

### Backend Dependencies
- Edge Function `user_create_with_password`
- Updates `profiles`, `user_roles`

---

## 5.2 `/settings/roles` (Optional – Capability Matrix)

### Purpose
Display and (optionally) customize what Staff can do.

### UI Structure
Table matrix:
Rows = capabilities
- View active session
- Add count event
- Add correction event
- Upload evidence image
- Manual search
- View other staff counts (default: yes)
- View baseline/expected (default: no)

Columns = roles
- Manager (always full)
- Staff (toggleable if allowed)

### Requirements
- By default, keep fixed permissions (simpler)
- If enabled, store per-business overrides in `feature_flags` / `business_settings.settings`

---

# 6) Syrve Integration Settings

## 6.1 `/settings/syrve`

### Purpose
Connect Syrve Server API and select the correct store profile.

### UI Structure
**A) Credentials Panel**
- server_url
- api_login
- api_password
- Button: Test connection
- Test output:
  - success: token acquired + timestamp
  - failure: error message

**B) Store Selection Panel**
- Dropdown: stores list from Syrve
- Optional: department selection

**C) Save Panel**
- Button: Save config
- Show last saved timestamp

### User Flow
1) Manager enters credentials
2) Click Test
3) If success → store list loads
4) Manager selects store
5) Save
6) Redirect suggestion: “Run first sync”

### Edge Cases
- Wrong credentials: show error
- Server URL unreachable: show error and guidance
- Test ok but no stores returned: show “contact support”

### Requirements
- Credentials stored encrypted
- Do not expose credentials to client

### Backend
- Edge Function `syrve_test_connection`
- Edge Function `syrve_save_config`
- Writes `syrve_config`

---

## 6.2 `/settings/syrve/sync`

### Purpose
Bootstrap and incremental sync, with controls and safeguards.

### UI Structure
**A) Sync Controls**
- Button: Bootstrap sync (first-time only)
- Button: Sync products
- Button: Sync groups/categories
- Button: Sync stores

**B) Sync Options**
- Toggle: “Deactivate products removed in Syrve”
- Toggle: “Sync only selected categories”
- Multi-select categories (if enabled)
- Toggle: “Auto reindex embeddings after sync”

**C) Sync History Table**
- run_type, status, started, finished, stats, error

### Sync Rules
- If Syrve not connected → sync disabled
- Prevent concurrent syncs:
  - use `sync_lock_until`
- Bootstrap sync must run before inventory can start

### User Flow: First Sync
1) Manager clicks Bootstrap Sync
2) System runs:
  - fetch stores
  - fetch categories/groups
  - fetch products
  - build search index embeddings
3) Show summary stats

### User Flow: Incremental Sync
1) Manager clicks Sync Products
2) System fetches latest catalog and updates local mirror
3) Optionally triggers embeddings reindex

### Requirements
- Sync must not break active inventory session:
  - catalog updates allowed, but baseline remains immutable
- Log all requests/responses (redacted)

### Backend
- Edge Functions:
  - `syrve_bootstrap_sync`
  - `syrve_sync_products`
  - `syrve_sync_categories`
  - `reindex_products`

---

## 6.3 `/settings/syrve/mapping` (Optional Advanced)

### Purpose
Control how Syrve groups map into in-scope categories for inventory.

### UI
- Category tree with toggles:
  - In scope for inventory
  - Default glass mapping (if category is wine)

---

# 7) Inventory Rules Settings

## 7.1 `/settings/inventory`

### Purpose
Control how inventorisation works.

### UI Structure
**A) Session Rules**
- Toggle: Approval required (recommended ON)
- Toggle: Allow counting after “end counting” (default OFF)
- Toggle: Allow negative corrections by Staff (default ON)

**B) Baseline Rules**
- Baseline source: Syrve snapshot only
- Button: “Test baseline pull”

**C) Units & conversions**
- Default bottle size ml
- Conversion logic description

### Behavior Rules
- Staff cannot view baseline values
- Manager can view baseline and all aggregates
- Append-only events

### Requirements
- Changing rules affects future sessions only

---

## 7.2 `/settings/inventory/approval`

### Purpose
Define approval workflow and manager responsibilities.

### UI
- Require manager approval to submit to Syrve
- Require manager review if variance exceeds threshold
- Variance threshold field (liters)

### Conditions
- If threshold set, session cannot be approved without manager opening review page

---

## 7.3 `/settings/inventory/baseline`

### Purpose
Control baseline selection.

### UI
- Store selection default
- Pull baseline on start: always
- Baseline timestamp display

---

# 8) Serving Rules (Glasses, Bottle Sizes, Mapping)

## 8.1 `/settings/serving/glasses`

### Purpose
Manage glass dimensions used for open bottle conversion and “sold by glass” logic.

### UI
**A) Glasses table**
Columns:
- Name
- Capacity ml
- Active
- Actions: edit, deactivate

**B) Add/Edit modal**
- name
- ml

### Requirements
- Capacity must be > 0
- Glass name unique per business

---

## 8.2 `/settings/serving/bottle-sizes`

### Purpose
Maintain bottle size dictionary.

### UI
- Table: 375, 500, 750, 1500 …
- Add/edit/deactivate

### Behavior
- Used as options for product overrides

---

## 8.3 `/settings/serving/mapping`

### Purpose
Map glasses and bottle size defaults to categories or products.

### UI Structure
**A) Category mapping table**
- Category
- Default bottle size (ml)
- Default glass (ml)
- Sold by glass default (toggle)

**B) Product overrides**
- Search product
- Override bottle size
- Override sold by glass
- Override glass size

### Matching rules (precedence)
1) Product override
2) Category default
3) Business default
4) Fallback (750ml)

### Requirements
- Show effective rule preview per product

---

# 9) Product Enrichment Defaults

## 9.1 `/settings/enrichment`

### Purpose
Set default behavior for enrichment layer.

### UI
- Toggle: Allow staff to upload label images during counting
- Toggle: Manager approval required before images used for recognition
- Default tags list (optional)
- Data completeness checklist

---

# 10) AI Recognition Settings

## 10.1 `/settings/ai`

### Purpose
Control recognition pipeline thresholds and behavior.

### UI Structure
**A) Enablement**
- Toggle: Recognition enabled
- Toggle: Vision verification enabled (cost control)

**B) Thresholds**
- Auto-preselect threshold (still requires confirm)
- Select-variant threshold (when year missing)
- Rescan threshold (suggest rescan)
- Embedding gap threshold (skip vision)

**C) Image Policy**
- Max image size (e.g., 1024)
- JPEG quality

**D) Vendor Config (hidden by default)**
- OCR provider: Google Vision
- Vision model: gpt-4.1-mini
- Embeddings: text-embedding-3-small

### Behavior Requirements
- If year not detected → show variants list (separate products) for same family
- Always require confirmation
- Store AI runs + feedback

---

## 10.2 `/settings/ai/label-library` (Optional)

### Purpose
Monitor coverage and improve recognition.

### UI
- Coverage: %products with label images
- Top products missing labels
- Upload label images in bulk

---

# 11) Data & Export

## 11.1 `/settings/data`

### Purpose
Data utilities.

### UI
- Button: Rebuild embeddings index
- Button: Recompute inventory aggregates (admin tool)
- Export configuration JSON (for support)

### Requirements
- Restricted: Manager only
- All actions logged

---

# 12) Diagnostics

## 12.1 `/settings/diagnostics`

### Purpose
Troubleshooting shortcuts.

### UI
- Links to logs screens
- “Copy diagnostics” (business id, sync runs, last errors)

---

# 13) Configuration Rules & Conditions (Proposals)

This section adds **additional configuration options and rules** you should implement to make the platform robust across different restaurants and inventory styles.

> Design principle: keep defaults simple for v1, but structure settings so you can progressively enable advanced behavior per tenant.

---

## 13.1 Integration Configuration (Syrve)

### A) Connection & Security
1) **Connection test required before store selection**
- Store dropdown is disabled until test succeeds.
- Reason: store list comes from Syrve test response.

2) **Singleton active config per business**
- Only one active Syrve config row per business.

3) **Token lifecycle**
- Always login → do work → logout in try/finally.

4) **Credential handling**
- Never return password/login to frontend.
- Encrypt password at rest; decrypt only in Edge Functions.

### B) Store / Department / Terminal mapping
5) **Default store required to start inventory**
- If no store selected → block session start.

6) **Allow multiple store profiles (future)**
- Optionally enable “multi-store” tenants: map several Syrve stores to internal stores.

### C) Sync rules
7) **Sync modes**
- Bootstrap sync (first-time)
- Incremental sync (manual)
- Scheduled auto-sync (cron)

8) **Auto-sync settings**
- Toggle auto-sync
- Interval selection (e.g., every 6h / daily)
- Quiet hours (optional): do not sync during service hours

9) **Selective sync scope**
- Option: “sync only selected categories/groups” (category tree selection)
- Option: “exclude categories” (blacklist)

10) **Deletion / deactivation behavior**
- When Syrve marks deleted:
  - default: set `is_active=false` locally
  - keep historical references for past sessions

11) **Sync conflict policy**
- Syrve overwrites core fields (name, unit, SKU, barcode)
- Our app overwrites enrichment fields only (images, tags, glass rules, wine family)

12) **Post-sync maintenance**
- Toggle: auto-reindex embeddings after product sync
- Toggle: auto-rebuild category tree cache

13) **Sync safety with active sessions**
- If a session is `in_progress`:
  - product changes from Syrve are allowed for catalog,
  - but session baseline remains immutable
  - if a product becomes inactive mid-session, it remains countable in that session

14) **Retry and rate limits**
- Config: retry attempts for Syrve calls (e.g., 3)
- Backoff strategy
- Special handling: license occupied → retry after delay

---

## 13.2 Inventory Configuration (Inventorisation)

### A) Session creation rules
1) **Counting scope**
- All products vs selected categories
- Optional: include/exclude inactive products

2) **Session naming**
- Auto name pattern: `INV-{YYYYMMDD}-{store_code}-{sequence}`

3) **Baseline rules**
- Always pull baseline from Syrve at session start
- Store baseline timestamp and revision
- Baseline is immutable

4) **Baseline fallback**
- If baseline pull fails:
  - block start by default
  - optional override: “Start without baseline” (advanced, manager-only)

### B) Counting rules (staff)
5) **Append-only events**
- Every entry creates a new event record.
- No overwriting.

6) **Per-user “virtual table” (recommended default)**
- Staff counts accumulate per user.
- Manager sees merged aggregates.
- Prevents “last write wins” issues.

7) **Correction model**
- Corrections are negative events.
- Config toggle: allow staff corrections vs manager-only corrections.

8) **Evidence attachments (optional but powerful)**
- Toggle: allow staff to attach photo evidence to a count event.
- Useful for disputes/variance explanation.

### C) Open bottle handling rules
9) **Open ML per product**
- Input `open_ml` stored per event
- Conversion to liters occurs in aggregation

10) **Rounding policy**
- Config:
  - Round liters to 3 decimals (default)
  - Round open_ml to nearest 5ml (optional)

11) **Max constraints**
- Config:
  - max open_ml per bottle (<= bottle size)
  - max unopened bottles per entry (e.g., 50) to prevent fat-finger errors

### D) Concurrency, locks, and session phases
12) **Active counting lock**
- Manager can “End counting” → transitions to `pending_review`
- Config: allow staff to continue after end (default OFF)

13) **Auto-timeout**
- Option: auto-end counting after X hours

14) **Variance thresholds**
- Config:
  - require manager review if abs(diff_liters) > threshold
  - require evidence for high variance items

### E) Review and approval rules
15) **Approval gate**
- Config: approval required to submit (default ON)

16) **Manager adjustments policy**
- Manager can add adjustment events
- Config: require reason comment for adjustment

17) **Audit outputs**
- On approval:
  - freeze aggregates snapshot
  - generate session report PDF/CSV (future)

### F) Submission to Syrve rules
18) **Validate-before-submit**
- Always call Syrve `check/incomingInventory` first
- If warnings: allow proceed with confirmation
- If invalid: block submit

19) **Outbox job**
- Submission is queued
- Retry policy configurable

---

## 13.3 Serving Rules Configuration (Glasses & Bottle Sizes)

### A) Dictionaries
1) **Glasses dictionary**
- name + ml
- active flag

2) **Bottle sizes dictionary**
- typical sizes 375/500/750/1500 etc.
- active flag

### B) Mapping
3) **Category defaults**
- per category: default bottle size, default glass, sold-by-glass default

4) **Product overrides**
- per product override values

5) **Precedence**
1) product override
2) category default
3) business default
4) fallback (750ml)

### C) Validation rules
- glass ml > 0
- bottle size ml > 0
- open_ml cannot exceed effective bottle size (unless “unknown bottle size” toggle is enabled)

---

## 13.4 AI Recognition Configuration

### A) Capture UX configuration (web mobile)
1) **Auto-capture enabled**
- Toggle: on/off

2) **Frame stability thresholds**
- min stable frames (e.g., 6)
- blur threshold (client heuristic)
- min label area ratio

3) **Retake policy**
- If confidence below threshold → UI suggests rescan
- Max attempts before forcing manual search (e.g., 3)

### B) Recognition pipeline toggles
4) **OCR provider selection**
- default: Google Vision

5) **Vision verification**
- Toggle: enabled/disabled
- Condition: only run when embedding top1-top2 gap is small

6) **Embeddings model**
- default: `text-embedding-3-small`

### C) Threshold settings
7) **Auto-preselect threshold**
- If score >= threshold → preselect product (still requires confirmation)

8) **Variant selection rule (mandatory)**
- If vintage year not detected → show all variants for wine family

9) **Mismatch rule**
- If name matched but year not matched:
  - show variant list
  - highlight best guess

10) **Hash shortcut**
- Toggle: enable label-hash matching
- Config: hash distance tolerance (future if using pHash)

### D) Label Library governance
11) **Image approval workflow**
- Toggle: manager approval required before image contributes to recognition

12) **Auto-enrichment from confirmed scans**
- If user confirms a match:
  - store image as candidate label
  - compute hash
  - link to product
  - optionally queue “approve” task for manager

### E) Cost controls
13) **Monthly AI budget guardrail**
- Config: max recognition calls/month
- If exceeded:
  - disable vision verification
  - keep OCR + embeddings only

14) **Caching windows**
- If same user scans same product within N minutes:
  - reuse last result

---

## 13.5 Global App Configuration (Cross-cutting)

1) **Locale and formatting**
- language, currency, timezone
- number formatting (decimal separators)

2) **Operational mode**
- “Service hours” schedule to avoid heavy sync

3) **Feature flags**
- enable/disable advanced modules per tenant

4) **Data retention**
- retention for images and raw OCR text
- anonymization options

---

# 14) Non-Functional Requirements

## Performance
- Settings pages should load within 2s typical
- Sync runs must show progress and not freeze UI

## Security
- Syrve credentials never exposed client-side
- Password handling secure
- Audit all admin actions

## Reliability
- Sync must be idempotent
- Prevent concurrent sync
- Baseline immutability for active sessions

---

# 14) Acceptance Criteria (Settings)

1) Manager can configure business profile, locale, defaults
2) Manager can connect Syrve, test connection, select store
3) Manager can run bootstrap sync and incremental sync; see run history
4) Manager can create staff via login/password; disable/reset password
5) Manager can configure inventory rules: approvals, corrections
6) Manager can manage glasses/bottle sizes and map them to categories/products
7) Manager can configure AI thresholds and recognition behavior

---

# 15) Implementation Notes (Backend)

## Required Edge Functions
- `syrve_test_connection`
- `syrve_save_config`
- `syrve_bootstrap_sync`
- `syrve_sync_products`
- `syrve_sync_categories`
- `reindex_products`
- `compute_label_hash`

## Required Tables
- business_profile, business_settings
- profiles, user_roles
- syrve_config, syrve_sync_runs, syrve_api_logs
- categories, products
- glass_dimensions, bottle_sizes, product_serving_rules
- media_assets, product_assets, label_hash_index

