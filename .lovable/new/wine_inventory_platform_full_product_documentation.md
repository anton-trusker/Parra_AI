# Wine Inventory Platform (Syrve-integrated)

## Product Documentation (v1)

**Purpose:** A multi-tenant inventory platform for restaurants using **Syrve Server API** as the **source of truth**. The platform is **generic (not wine-specific)** but supports **wine-first enrichment** (images, vintages, glass rules) to make **inventory counts (inventorisation)** fast and accurate using **AI/OCR label recognition**.

**Core principle:**
- Syrve owns: products, groups/categories, stores/warehouses, core item attributes.
- Our platform owns: enriched metadata, label library, AI recognition, inventory sessions & collaborative counting, audit logs, export jobs to Syrve.

---

# 1. Scope and Non-Scope

## In scope
- Authentication (login + password)
- Role-based access control
- First-time setup & Syrve connection
- Sync/import from Syrve Server API
- Catalog browsing + enrichment layer
- AI label recognition + variant selection (vintage)
- Inventory sessions: start → count → review → approve → send to Syrve
- Reports (inventory, variances) and operational logs

## Explicitly out of scope (v1)
- Creating/editing items, groups, categories in Syrve from our app
- Invoices (explicitly out of scope)
- Complex location tracking (shelf/fridge mapping)
- POS sales analytics beyond what’s required for inventory baseline

---

# 2. Roles, Permissions, and Visibility

## Roles
### 2.1 Super_admin
- Global platform owner (you)
- Can view/manage all tenants and internal operations
- **Invisible to tenants**: no restaurant user can view super_admin profile or activity.

### 2.2 Manager
- Primary admin for a restaurant tenant
- Can configure everything inside their business:
  - connect Syrve
  - sync data
  - configure glasses/bottle rules
  - manage staff users and permissions
  - start/close inventory sessions
  - review variances
  - send inventory results to Syrve
  - view reports/logs

### 2.3 Staff
- Operational user for inventory counting
- Can:
  - view active inventory session
  - scan labels / search products
  - enter quantities (unopened bottles + open ml)
  - see own entries and session progress
- Cannot:
  - see expected stock/baseline values
  - close/approve/send to Syrve
  - change business settings

## Permission model
- Default permissions per role; Manager can optionally restrict staff actions (future flag).
- Row Level Security in Supabase using `business_id` isolation.

---

# 3. Platform Architecture

## 3.1 High-level components
- **Frontend:** Web app (mobile responsive)
- **Backend:** Supabase
  - Postgres + pgvector
  - Storage
  - Edge Functions
  - Auth

## 3.2 Integrations
- **Syrve Server API** only (no Client API)
- AI services:
  - OCR (Google Vision OCR recommended)
  - Embeddings + Vision verification (OpenAI)

## 3.3 Security
- All Syrve credentials stored encrypted
- External API keys only in Edge Function environment variables
- Storage bucket private; signed URLs used for temporary access

---

# 4. Data Ownership and Sync Strategy

## 4.1 Syrve is Source of Truth
We import and mirror Syrve data; our platform does not create/edit Syrve catalog entities.

## 4.2 Our enrichment layer
We add:
- product images + label library
- wine-specific metadata
- serving rules (sold by glass, glass size mapping)
- inventory sessions and history
- AI recognition runs + feedback

## 4.3 Sync modes
- **Bootstrap Sync:** First connection: fetch core business structure + product catalog
- **Incremental Sync:** periodic/manual re-sync to reflect Syrve changes
- **Session Baseline Pull:** at start of inventory: pull latest stock/balance snapshot

---

# 5. Core Domain Concepts

## 5.1 Business
A tenant restaurant.

## 5.2 Store (Warehouse)
Syrve store/warehouse used for baseline stock and for inventory document export.

## 5.3 Category (Group)
Syrve product group hierarchy.

## 5.4 Product
A Syrve item mirrored into our platform.
- **Vintage rule:** Same wine name, different year are stored as **separate products** in our DB (separate rows).
- We link vintages through **Wine Family**.

## 5.5 Wine Family
Canonical grouping (producer + label) used to show variant list when year is unknown.

## 5.6 Inventory Session
A single inventorisation run:
- baseline captured at start
- collaborative counting by staff
- manager review + approval
- export to Syrve

## 5.7 Count Events (append-only)
Each staff entry is a separate event (no overwrites). Aggregates are computed.

---

# 6. Inventory (Inventorisation) Workflow

## 6.1 Session Lifecycle
1) Draft (created by Manager)
2) In Progress (counting)
3) Pending Review (counting ended)
4) Approved (locked)
5) Synced (sent to Syrve)
6) Cancelled / Flagged

## 6.2 Start Session (Manager)
- Select Store (Syrve)
- Select scope (all categories or subset)
- Pull baseline from Syrve (expected stock)
- Create session + baseline items
- Move status to `in_progress`

## 6.3 Counting (Staff)
- Staff opens active session
- Can:
  - scan bottle label (auto capture)
  - search manually
- For each found product:
  - enter `bottles_unopened`
  - enter `open_ml`
  - press Add
- System stores count event and updates aggregates

### Collaborative counting rule
- Multiple staff can count same product; events accumulate.
- No overwriting.
- Optionally each staff has “My Counts” view.

## 6.4 Manager Review
- Manager sees:
  - baseline expected values
  - counted totals (liters + bottles)
  - variances
- Manager can add corrections (creates manager_adjustment events)
- Manager sets session to `approved`

## 6.5 Export to Syrve
- Generate Syrve inventory document payload
- Run Syrve validation (check)
- On success: import
- Store document IDs and responses
- Session becomes `synced`

---

# 7. AI Label Recognition (Core Spec)

## 7.1 UX Goals
- No “capture” button: auto-capture when frame is stable & readable.
- Always show confirmation screen:
  - Confirm
  - Choose Variant
  - Rescan
  - Manual Search

## 7.2 Recognition pipeline
1) Upload image to Storage
2) Edge Function `recognize_label`
3) Shortcuts:
   - label hash match (near-zero cost)
4) OCR extract text
5) Embedding retrieval (pgvector) → candidates
6) Vintage extraction:
   - if year detected and exists → preselect product
   - if year missing → **show all variants** for Wine Family
7) If ambiguous → optional vision verification

## 7.3 Vintage Variant Rules
- Each vintage is a separate Product row.
- If year not detected:
  - return list of products within same Wine Family (sorted by newest)
  - user selects correct year
- If year detected but not present:
  - show variants list and allow selection; warn year not found

## 7.4 Cost reduction
- Store label images + aHash/pHash for matching
- Build label library from confirmed scans (with manager approval)
- Skip vision when embedding top1-top2 gap is high

---

# 8. Pages and Navigation

## 8.1 Navigation by role
### Staff (mobile-first)
- Active Inventory
- Scan & Add
- My Counts
- Help

### Manager
- Dashboard
- Inventory Sessions
- Catalog
- Reports
- Settings
- Logs

---

# 9. Page-by-Page Specifications

> Expanded to **component-level wireframe structure**: layout, components, states, actions, validations, and API calls.

## Global UI Building Blocks (used across pages)

### G1. Top App Shell
- **Header bar**
  - Left: Business selector (Super_admin only), current business name (Manager/Staff)
  - Center: Page title (dynamic)
  - Right: User menu (name, role badge, logout)
- **Left sidebar (desktop)**
  - Menu items depend on role
- **Bottom nav (mobile)**
  - Staff: Active Session, Scan, My Counts, Search/Help
  - Manager: Dashboard, Inventory, Catalog, Settings

### G2. System Notifications (toast)
- Success toast
- Error toast with “View details” (opens error drawer)

### G3. Loading & Offline states
- Full-page skeleton
- Inline skeleton for tables
- Offline banner (if navigator offline)

### G4. Confirmation Modal (generic)
- Title, summary, confirm button, cancel button
- Used for approve session, submit to Syrve, delete assets, etc.

### G5. Error Drawer
- Shows last error message, correlation id, function name
- “Copy diagnostics” button

---

## 9.1 Auth

### 9.1.1 `/login`
**Purpose:** Username/password login (not email-based).

**Layout**
- Center card
  - Logo
  - Title: “Sign in”

**Components**
- Input: `login` (text)
- Input: `password` (password)
- Button: `Sign in`
- Link: `Forgot password` (optional v1.1)

**States**
- Idle
- Submitting
- Error: invalid credentials
- Locked: too many attempts (rate-limited)

**Validations**
- login required
- password required

**Actions**
- On submit: call Edge Function `auth_login_password`

**Events**
- `auth.login_success`
- `auth.login_failed`

**API**
- `POST /functions/v1/auth_login_password` { login, password }
- Response: session token set by Supabase Auth

---

## 9.2 Setup Wizard (Manager)

### 9.2.1 `/onboarding`
**Purpose:** Create tenant + initial config.

**Layout**
- Stepper (top)
- Content card

**Components**
- Step 1: Business
  - Input: business name
  - Dropdown: language
  - Dropdown: currency
  - Dropdown: timezone
- Step 2: Manager profile
  - Input: full name
  - Input: login (username)
  - Input: password

**States**
- Step in progress
- Submitting
- Completed → redirect to `/settings/syrve`

**Validations**
- business name required
- login unique in business
- password min length (configurable)

**Actions**
- Create business + settings + user role assignment

**Events**
- `business.created`
- `user.role_assigned`

**API**
- `POST /functions/v1/business_create` { business, managerUser }

---

### 9.2.2 `/settings/syrve`
**Purpose:** Connect Syrve Server API.

**Layout**
- Page header with status badge: Connected/Disconnected
- 2-column (desktop) / stacked (mobile)

**Left block: Credentials**
- Input: server_url
- Input: api_login
- Input: api_password (masked)
- Button: Test connection
- Result box:
  - Success: “Connected” + latency
  - Failure: error code/message

**Right block: Business profile selection**
- Dropdown: Syrve “Store/Warehouse” list
- (Optional) Dropdown: Department/Terminal group (if needed)
- Button: Save config

**States**
- Disconnected
- Testing
- Connected (test ok)
- Saved

**Validations**
- server_url required (must be https/http)
- login required
- password required

**Actions**
- Test → calls Syrve auth endpoint server-side
- Save → stores encrypted credentials, selected store id

**Events**
- `syrve.connection_tested`
- `syrve.config_saved`

**API**
- `POST /functions/v1/syrve_test_connection` { server_url, login, password }
- `POST /functions/v1/syrve_save_config` { server_url, login, password, default_store_id }

---

### 9.2.3 `/settings/syrve/sync`
**Purpose:** Bootstrap and incremental sync.

**Layout**
- Sync status panel (last sync time, last result)
- Buttons row
- Sync runs table

**Components**
- Buttons:
  - Bootstrap Sync (first time)
  - Sync Products
  - Sync Categories
  - Sync Stores
- Table: Sync Runs
  - Columns: started_at, run_type, status, updated_count, created_count, error
  - Row click → details drawer

**States**
- Idle
- Running (disable buttons)
- Completed
- Failed

**Actions**
- Start sync job (creates `syrve_sync_runs` and runs steps)

**Events**
- `syrve.sync_started`
- `syrve.sync_finished`

**API**
- `POST /functions/v1/syrve_bootstrap_sync`
- `POST /functions/v1/syrve_sync_products`
- `POST /functions/v1/syrve_sync_categories`

---

## 9.3 Dashboard

### 9.3.1 `/dashboard` (Manager)
**Purpose:** Manager overview.

**Layout**
- Grid cards (desktop)
- Stacked cards (mobile)

**Components**
- Card: Active Inventory Session
  - Status, start time, progress bar
  - Buttons: Continue / Review (role-based)
- Card: Last Syrve Sync
  - time, result
  - Button: Sync now
- Card: Recognition Health
  - scans last 7 days, % confirmed first choice, % rescan, top failures
- Card: Inventory Summary
  - last session variances count, biggest shortage items

**States**
- Loading
- No data

**Actions**
- Quick start inventory

**API**
- Query `inventory_sessions` (latest)
- Query `syrve_sync_runs` (latest)
- Query aggregated AI stats (view)

---

## 9.4 Inventory

### 9.4.1 `/inventory`
**Purpose:** Sessions list.

**Layout**
- Filters row
- Table list

**Components**
- Filters:
  - Status multi-select
  - Store dropdown
  - Date range
  - Created by
- Button: New session (Manager)
- Table:
  - Columns: created_at, title, store, status, progress, last activity
  - Row actions: Open, Duplicate (optional), Export report (later)

**States**
- Empty list
- Loading

**Actions**
- Navigate to session

**API**
- SELECT from `inventory_sessions` with filters

---

### 9.4.2 `/inventory/new` (Manager)
**Purpose:** Create inventory session (wizard).

**Layout**
- Stepper + primary action button

**Step 1: Session info**
- Input: Title (optional)
- Dropdown: Store (required)
- Toggle: Count all categories vs selected

**Step 2: Category scope**
- Tree list of categories with checkboxes
- Quick actions: Select all, Select none

**Step 3: Baseline**
- Card: “Pull baseline from Syrve”
- Button: Load baseline
- Show results: #items, baseline timestamp

**Step 4: Start**
- Summary
- Button: Start session

**States**
- Loading stores/categories
- Baseline pulling
- Validation errors

**Actions**
- Create session
- Pull baseline
- Start session

**Events**
- `inventory.session_created`
- `inventory.baseline_loaded`
- `inventory.session_started`

**API**
- `POST /functions/v1/inventory_create_session` { store_id, scope }
- `POST /functions/v1/inventory_load_baseline` { session_id }

---

### 9.4.3 `/inventory/:id`
**Purpose:** Session overview.

**Layout**
- Header: status badge + timeline
- Two columns: progress + actions

**Components**
- Timeline: Draft → In progress → Pending Review → Approved → Synced
- Card: Progress
  - Total products counted, events count, active staff
- Card: Staff activity
  - List: staff name, last action time, events count
- Buttons (role-based):
  - Staff: Continue counting
  - Manager: End counting, Review, Submit to Syrve

**States**
- Session not found
- Status locked

**Actions**
- Transition status:
  - Manager: set to pending_review

**API**
- SELECT session + aggregate progress
- `POST /functions/v1/inventory_end_counting` { session_id }

---

### 9.4.4 `/inventory/:id/count` (Staff + Manager)
**Purpose:** Counting UI (mobile-first).

**Layout (mobile)**
- Tabs: Scan | Search | Recent
- Bottom sheet for quantity entry

**Components**

**Tab: Scan**
- Camera viewport with overlay frame
- Status chip: Scanning / Hold steady / Processing / Result
- Result panel:
  - Product card (name, year, thumbnail)
  - Confidence indicator
  - Buttons: Confirm, Choose variant, Rescan

**Auto-capture logic (client)**
- Capture frames at 6–10 fps
- When stable+sharp for N frames → capture image and upload
- Immediately call `recognize_label`

**Variant selector modal**
- If year not detected: show all variant products (years) within family
- If year detected but mismatch: highlight detected year vs available years

**Quantity Entry Bottom Sheet**
- Fields:
  - Unopened bottles (stepper)
  - Open bottle amount (ml) (numeric)
- Button: Add
- Option: Add another (keeps modal)

**Tab: Search**
- Search input
- Filters: category, year
- Results list
- Tap product → open quantity sheet

**Tab: Recent**
- List of recently counted items (per user)

**States**
- No camera permission
- Uploading
- Recognition error

**Actions**
- Add count event (append-only)

**Events**
- `inventory.scan_started`
- `inventory.recognition_result`
- `inventory.variant_selected`
- `inventory.count_added`

**API**
- Upload to Storage
- `POST /functions/v1/recognize_label` { business_id, path, session_id }
- `INSERT inventory_count_events` { session_id, product_id, bottles_unopened, open_ml, method }

---

### 9.4.5 `/inventory/:id/my-counts` (Staff)
**Purpose:** View and correct own entries.

**Layout**
- List grouped by product

**Components**
- Group header: product name + total entered by user
- Events list: timestamp, bottles, open_ml
- Button: “Add correction”

**Correction model**
- No edits; corrections are new negative events:
  - e.g., -1 bottle or -120 ml

**API**
- SELECT from `inventory_count_events` where counted_by=me
- INSERT correction event

---

### 9.4.6 `/inventory/:id/review` (Manager)
**Purpose:** Review variances.

**Layout**
- Summary cards (top)
- Variance table (main)
- Detail drawer (right)

**Components**
- Summary cards:
  - Total expected liters
  - Total counted liters
  - Total variance liters
  - #items with variance
- Filters:
  - Shortage only / Excess only
  - Min variance threshold
  - Category
- Variance table columns:
  - Product (name + year)
  - Expected (liters)
  - Counted (liters)
  - Diff (liters)
  - Counted bottles / open liters
  - Actions: View details, Add adjustment
- Detail drawer:
  - All count events by staff
  - Evidence images (if any)
  - Add manager adjustment

**Actions**
- Add manager adjustment (creates event)
- Approve session

**API**
- Manager-only SELECT baseline
- SELECT aggregates
- `POST /functions/v1/recompute_inventory_variances` (optional)
- INSERT manager adjustment event
- UPDATE session status

---

### 9.4.7 `/inventory/:id/submit` (Manager)
**Purpose:** Send to Syrve.

**Layout**
- Stepper: Validate → Submit → Done

**Components**
- Step 1: Validate
  - Button: Run Syrve validation
  - Validation result panel (errors list)
- Step 2: Submit
  - Button: Submit to Syrve
  - Outbox job status (pending/processing/success/failed)
  - Retry button if failed
- Step 3: Done
  - Syrve document id
  - Timestamp

**Actions**
- Create outbox job
- Run check and import

**API**
- `POST /functions/v1/inventory_submit_to_syrve` { session_id }
- SELECT outbox job

---

## 9.5 Catalog

### 9.5.1 `/catalog`
**Purpose:** Read-only catalog with enrichment.

**Layout**
- Search + filters row
- Table/grid

**Components**
- Search input
- Filters:
  - Category
  - Vintage year
  - Has images
  - Sold by glass
- Table columns:
  - Product name
  - Year
  - Category
  - Bottle size
  - Has label images (icon)
  - Actions: Open

**API**
- SELECT from products with joins to serving rules and assets

---

### 9.5.2 `/catalog/:productId`
**Purpose:** Product detail.

**Layout**
- Header: name + year badge
- Tabs: Overview | Variants | Images | History | Syrve

**Tab: Overview**
- Editable fields (manager only):
  - producer
  - region
  - bottle size override
  - sold by glass toggle
  - notes/tags

**Tab: Variants**
- List all products in same wine_family
- Buttons:
  - Link/unlink family

**Tab: Images**
- Gallery
- Upload
- Set primary

**Tab: History**
- Inventory sessions list where counted

**Tab: Syrve**
- Read-only JSON viewer of syrve_data

**API**
- SELECT product + assets + family variants
- UPDATE metadata fields (manager)

---

### 9.5.3 `/catalog/:productId/images` (Manager)
**Purpose:** Manage label library.

**Components**
- Upload dropzone
- Gallery with role tags
- Button: Compute label hash (auto on upload)
- Toggle: Approved for recognition

**API**
- Upload to Storage
- INSERT `media_assets` + `product_assets`
- `POST /functions/v1/compute_label_hash`

---

## 9.6 Settings

### 9.6.1 `/settings/business` (Manager)
- Form: name, currency, language, timezone
- Save

### 9.6.2 `/settings/users` (Manager)
**Layout**
- Users table + invite/create modal

**Components**
- Table columns: name, login, role, status, last active
- Button: Create user
- Modal: create staff
  - login (username)
  - password
  - role

**API**
- `POST /functions/v1/user_create_with_password` (service role)

---

### 9.6.3 `/settings/inventory` (Manager)
**Components**
- Toggle: approval required
- Default bottle size
- Negative correction allowed
- Save

---

### 9.6.4 `/settings/serving` (Manager)
**Components**
- Glass dimensions table (name, ml)
- Add/Edit glass modal
- Category mapping table

---

### 9.6.5 `/settings/ai` (Manager)
**Components**
- Toggle: enable recognition
- Toggle: enable vision verification
- Threshold sliders:
  - auto-select threshold
  - show-variants threshold
  - rescan threshold
- Save

---

## 9.7 Reports

### 9.7.1 `/reports`
**Components**
- Date range
- Session summary table
- Export buttons (csv later)

---

## 9.8 Logs

### 9.8.1 `/logs`
**Layout**
- Tabs: Sync Runs | API Logs | Outbox | Errors

**Sync Runs tab**
- Table: run_type, status, started, finished

**API Logs tab**
- Table: action_type, status, created_at

**Outbox tab**
- Table: job_type, status, attempts
- Button: Retry

**Errors tab**
- Table: severity, source, message

---

# 10. Events and Telemetry

## 10.1 Core event list
- auth.login_success / failed
- syrve.connection_tested
- syrve.sync_started / finished
- inventory.session_created
- inventory.session_started
- inventory.scan_started
- inventory.recognition_result
- inventory.count_added
- inventory.session_approved
- syrve.inventory_check_sent
- syrve.inventory_import_sent
- inventory.session_synced

Each event stores:
- business_id, user_id, session_id (optional)
- timestamp
- metadata

---

# 11. Edge Functions (Backend Services)

## 11.1 Function list
- `syrve_test_connection`
- `syrve_bootstrap_sync`
- `syrve_sync_products`
- `inventory_start_session` (pull baseline)
- `recognize_label`
- `reindex_products`
- `compute_label_hash`
- `inventory_submit_to_syrve`

Each function:
- runs with service role
- validates business ownership
- writes audit logs

---

# 12. Acceptance Criteria (MVP)

## Setup
- Manager can connect Syrve and run initial sync

## Inventory
- Manager can start a session with baseline
- Staff can scan/add counts concurrently
- Manager can review variances, approve, submit to Syrve

## Recognition
- Auto-capture works on mobile web
- If year not detected → variant picker shows all vintages
- Always requires user confirmation

---

# 13. Open Questions (to resolve during implementation)
- Username format for login (email-like vs phone vs custom)
- Password reset flow
- Whether managers can create staff passwords or staff set their own
- How to handle Syrve product changes mid-session

