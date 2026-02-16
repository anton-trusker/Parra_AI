# Supabase Integration — Complete Documentation Index

This index provides a complete overview of all Supabase integration documentation for the Inventory AI platform.

## Documentation Structure

The `doc/new/wind_spec/` directory contains the complete Supabase integration specification:

| Document | Purpose |
|----------|---------|
| `00-documentation-index.md` | This file — overview and navigation |
| `01-supabase-integration-overview.md` | High-level architecture, data flow, and core principles |
| `02-database-schema-tables-relations.md` | Complete database schema with all tables, columns, and relationships |
| `03-auth-rls-permissions.md` | Authentication model, RLS policies, and role-based permissions |
| `04-edge-functions-syrve-sync-jobs.md` | All Edge Functions with naming conventions and logic |
| `05-compatibility-migration-notes.md` | Migration notes from current repo structure |
| `06-settings-pages-logic.md` | Complete settings pages specification |

---

## Key Architectural Principles

### 1. Single Client Platform
- One restaurant/business per Supabase project
- No multi-tenant logic — all tables are for a single business
- Simplified RLS: authenticated users access all data, role-based restrictions only

### 2. Syrve as Source of Truth
Syrve owns:
- Organization structure (departments, stores)
- Product catalog (categories, products)
- Baseline stock snapshot at inventory start

### 3. App as Source of Truth
The app owns:
- Product enrichment (images, wine details, serving rules)
- AI recognition runs and feedback
- Inventory sessions and counting history
- Export jobs and audit logs

### 4. Event-Sourced Inventory
- **Baseline**: Immutable snapshot in `inventory_baseline_items` (manager-only)
- **Events**: Append-only `inventory_count_events` (staff can insert, no overwrites)
- **Aggregates**: `inventory_product_aggregates` for fast totals
- **Export**: `syrve_outbox_jobs` for reliable delivery to Syrve

### 5. Generic Platform, Wine-First Client
- Platform is generic (not wine-specific)
- Wine restaurant is first client with additional enrichment
- Optional `wines` table for wine-specific fields (producer, vintage, region, etc.)

---

## Database Schema Summary

### Core Layers

1. **User Layer**
   - `business_profile` (business settings — singleton, 1 row)
   - `profiles` (user profiles)
   - `roles` + `user_roles` (RBAC)

2. **Logging + Settings**
   - `app_settings` (inventory defaults, AI settings — singleton, 1 row)
   - `feature_flags`
   - `audit_logs`, `error_logs`

3. **Syrve Integration**
   - `syrve_config` (singleton — 1 row)
   - `syrve_raw_objects` (lossless mirror)
   - `syrve_sync_runs` (sync job tracking)
   - `syrve_api_logs` (API call history)
   - `syrve_outbox_jobs` (reliable export queue)

4. **Organization + Catalog**
   - `org_nodes` (departments, stores)
   - `stores`
   - `categories`
   - `products` (canonical Syrve mirror)
   - `product_barcodes`

5. **Enrichment Layer**
   - `wines` (optional 1:1 extension)
   - `glass_dimensions`
   - `bottle_sizes`
   - `product_serving_rules`
   - `product_traits`

6. **Media + AI**
   - `media_assets`
   - `product_assets`
   - `ai_runs`
   - `ai_match_candidates`
   - `ai_feedback`
   - `product_search_index` (pgvector for OCR/embeddings)
   - `ai_config` (AI settings — singleton, 1 row)

7. **Inventory**
   - `inventory_sessions`
   - `inventory_baseline_items`
   - `inventory_count_events`
   - `inventory_product_aggregates`
   - `inventory_variances` (optional)
   - `stock_snapshots` (optional)

---

## Authentication & Authorization

### Supported Login Modes
1. **Email + password** (standard Supabase)
2. **Login name + password** (synthetic email: `loginName@inventory.local`)

### Role Model
- `super_admin` (platform owner; full access to all data and settings)
- `manager` (restaurant admin; can configure app, connect to Syrve, manage staff, approve inventory)
- `staff` (counting; can count inventory, cannot see expected baseline)
- Optional: `viewer` (read-only access)

### RLS Policies
- **Authenticated access**: All tables accessible to authenticated users
- **Role-based restrictions**: Managers have write access, staff have limited access
- **Baseline protection**: Only managers can see `inventory_baseline_items`
- **Append-only events**: Staff can insert `inventory_count_events` but not update/delete
- **Storage**: Private buckets with signed URLs

---

## Edge Functions

### Naming Convention
All functions use **kebab-case** as the canonical name. Aliases are documented in `04-edge-functions-syrve-sync-jobs.md`.

### Syrve Integration Functions
- `syrve-connect-test` (validate credentials)
- `syrve-save-config` (encrypt and store)
- `syrve-bootstrap-sync` (first-time full sync)
- `syrve-sync-products` (incremental catalog sync)
- `syrve-process-outbox` (reliable export queue processor)

### Inventory Functions
- `inventory-create-session` (create session record)
- `inventory-load-baseline` (pull baseline from Syrve)
- `inventory-submit-to-syrve` (submit approved session)

### AI Functions
- `ai-label-recognition` (or `ai-scan`) — OCR + pgvector + vision verification
- `compute-label-hash` (perceptual hash for re-matching)
- `admin-reindex-products` (rebuild embeddings)

### Auth Functions (optional)
- `auth-login-username` (username/password login via synthetic email)

---

## Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `product-labels` | Confirmed label library images | Private + signed URLs |
| `inventory-evidence` | Per-session evidence images | Private + signed URLs |
| `ai-scans` | Temporary scan images for AI processing | Private + signed URLs (auto-delete after 30 days) |

---

## Required Extensions

- `pgcrypto` (UUID generation)
- `uuid-ossp` (optional)
- `pgvector` (for embedding search)
- `vault` (for secret management)

---

## AI Pipeline (OCR + Embeddings + Vision)

### Pipeline Steps
1. **Capture**: Image uploaded to `ai-scans` bucket
2. **OCR**: Google Vision extracts text
3. **Embedding Search**: `product_search_index` with pgvector similarity
4. **Vision Verification**: Gemini 1.5 Flash verifies candidates
5. **Return**: Ranked product list with confidence scores

### Learning Loop
- User confirms or corrects matches
- Feedback stored in `ai_feedback`
- High-confidence matches reinforce embeddings
- Failed scans flagged for manual review

---

## Settings Pages

All settings are documented in `06-settings-pages-logic.md`:

| Page | Path | Access | Purpose |
|------|------|--------|---------|
| Syrve Integration | `/settings/syrve` | Manager, Super Admin | Connect to Syrve Server API |
| Business Identity | `/settings/business` | Manager, Super Admin | Business name, logo, localization |
| User Management | `/settings/users` | Manager, Super Admin | Create/edit users, assign roles |
| Role Management | `/settings/roles` | Manager, Super Admin | Create/edit roles, permissions |
| Glass & Serving | `/settings/serving` | Manager, Super Admin | Glass sizes, serving rules |
| AI Configuration | `/settings/ai` | Manager, Super Admin | AI providers, API keys |
| Inventory Settings | `/settings/inventory` | Manager, Super Admin | Inventory defaults, workflow |
| System Logs | `/settings/logs` | Manager, Super Admin | Audit logs, error logs, sync logs |

---

## Implementation Checklist

### Supabase Setup
- [ ] Create new Supabase project
- [ ] Enable extensions (`pgcrypto`, `pgvector`, `vault`)
- [ ] Create storage buckets (`product-labels`, `inventory-evidence`, `ai-scans`, `logos`)
- [ ] Configure secrets (Syrve encryption key, AI provider keys)

### Database Migrations
- [ ] Apply schema from `02-database-schema-tables-relations.md`
- [ ] Create RLS policies from `03-auth-rls-permissions.md`
- [ ] Create vector index on `product_search_index.embedding`
- [ ] Insert initial singleton rows:
  - `business_profile` (1 row with fixed ID)
  - `app_settings` (1 row with fixed ID)
  - `syrve_config` (1 row with fixed ID)
  - `ai_config` (1 row with fixed ID)
  - `roles` (super_admin, manager, staff)

### Edge Functions
- [ ] Deploy all Syrve functions (`syrve-connect-test`, `syrve-save-config`, etc.)
- [ ] Deploy inventory functions (`inventory-create-session`, `inventory-load-baseline`, etc.)
- [ ] Deploy AI functions (`ai-label-recognition`, `compute-label-hash`, `admin-reindex-products`)
- [ ] Deploy user management functions (`create-user`)
- [ ] Test function authentication and role-based access

### Settings Pages
- [ ] Implement Syrve connection page
- [ ] Implement business identity page
- [ ] Implement user management page
- [ ] Implement role management with permission matrix
- [ ] Implement glass & serving settings
- [ ] Implement AI configuration page
- [ ] Implement inventory settings page
- [ ] Implement system logs viewer

---

## Related Documentation

### Product Documentation
- `doc/new/wine_inventory_platform_full_product_documentation.md` — Full product vision and requirements

### AI Documentation
- `doc/new/AI/ocr_spec.md` — OCR pipeline specification
- `doc/new/AI/ocr_scheme.md` — Technical blueprint for web app

### Syrve Integration
- `doc/new/syrve_integration/spec_syrve.md` — Syrve integration logic
- `doc/new/syrve_integration/supabase_syrve_db.md` — SQL migration pack
- `doc/new/syrve_integration/syrve_db_architecture.md` — Architecture overview

### EDI Documentation
- `doc/new/EDI_doc/06_AI_Integration_Spec.md` — AI integration details
- `doc/new/EDI_doc/07_Supabase_Setup_Guide.md` — Setup instructions

### Page Specifications
- `doc/new/12-page-field-specifications.md` — UI field requirements

---

## Next Steps

1. **Review this index** to understand the complete system
2. **Read each wind_spec document** for detailed implementation guidance
3. **Follow the implementation checklist** to set up the new Supabase project
4. **Refer to 05-compatibility-migration-notes.md** for migration strategy

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-13 | Initial complete documentation set |
| 1.1 | 2026-02-13 | Added `product_search_index` (pgvector), `ai_config`, missing product fields, reconciled function names |
