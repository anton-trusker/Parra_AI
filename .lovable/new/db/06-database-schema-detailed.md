# 06 — Database Schema (Detailed)

## 1. Core System Tables

### `profiles`
User profiles linked to Supabase Auth.
- `id`: uuid (PK, references auth.users)
- `email`: text
- `full_name`: text
- `role`: text (super_admin, admin, manager, staff)
- `avatar_url`: text
- `business_id`: uuid (FK -> business_profile)
- `is_active`: boolean (default: true)
- `created_at`: timestamptz

### `business_profile`
Main entity for SaaS multi-tenancy.
- `id`: uuid (PK)
- `name`: text (Business Name)
- `logo_url`: text
- `contact_email`: text
- `contact_phone`: text
- `address`: text
- `currency`: text (default: 'USD')
- `language`: text (default: 'en')
- `ai_api_key`: text (Encrypted, optional user-provided Gemini key)
- `use_default_ai_key`: boolean (default: true)
- `created_at`: timestamptz

---

## 2. Syrve Integration Tables

### `syrve_config`
- `id`: uuid (PK)
- `business_id`: uuid (FK -> business_profile)
- `server_url`: text
- `api_login`: text
- `api_password_encrypted`: text
- `store_id`: uuid
- `organization_id`: uuid
- `connection_status`: text (connected, disconnected, error)
- `last_sync_at`: timestamptz
- `inventory_approval_required`: boolean (default: true)
- `auto_matching_enabled`: boolean (default: true)
- `created_at`: timestamptz

---

## 3. Product & Catalog Tables

### `categories`
Category-agnostic hierarchy.
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `syrve_group_id`: uuid (Unique per business)
- `name`: text
- `parent_id`: uuid (Self-reference)
- `default_glass_id`: uuid (FK -> glass_dimensions)
- `default_unit`: text (liters, ml, grams, etc.)
- `is_active`: boolean
- `synced_at`: timestamptz

### `products`
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `category_id`: uuid (FK -> categories)
- `syrve_product_id`: uuid
- `sku`: text (Syrve 'num')
- `name`: text
- `description`: text
- `unit_name`: text
- `unit_capacity`: decimal
- `purchase_price`: decimal
- `retail_price`: decimal
- `stock_on_hand`: decimal
- `stock_expected`: decimal
- `par_level`: decimal
- `image_url`: text
- `syrve_data`: jsonb (Raw Syrve product data)
- `metadata`: jsonb (Dynamic fields: ABV, Vintage, etc.)
- `is_active`: boolean
- `synced_at`: timestamptz

### `product_barcodes`
- `id`: uuid (PK)
- `product_id`: uuid (FK)
- `barcode`: text (Unique per business)
- `is_primary`: boolean

---

## 4. Inventory Management Tables

### `inventory_sessions`
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `session_number`: text (e.g., INV-2026-001)
- `status`: text (draft, in_progress, pending_review, approved, synced, cancelled)
- `created_by`: uuid (FK -> profiles)
- `approved_by`: uuid (FK -> profiles)
- `started_at`: timestamptz
- `completed_at`: timestamptz
- `syrve_document_id`: text
- `notes`: text

### `inventory_items`
- `id`: uuid (PK)
- `session_id`: uuid (FK)
- `product_id`: uuid (FK)
- `user_id`: uuid (FK -> profiles)
- `location_id`: uuid (FK -> locations)
- `quantity`: decimal
- `is_opened`: boolean
- `captured_at`: timestamptz
- `image_url`: text (For AI verification)
- `method`: text (manual, barcode, ai)

### `locations`
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `name`: text
- `parent_id`: uuid (Hierarchy)
- `is_active`: boolean

---

## 5. Configuration & Logic Tables

### `glass_dimensions`
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `name`: text (e.g., "Standard Wine Glass")
- `capacity_ml`: decimal
- `is_active`: boolean

### `feature_flags`
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `flag_key`: text (e.g., "ai_recognition")
- `is_enabled`: boolean
- `description`: text

### `audit_logs`
- `id`: uuid (PK)
- `business_id`: uuid (FK)
- `user_id`: uuid (FK)
- `action`: text
- `resource_type`: text
- `resource_id`: uuid
- `old_values`: jsonb
- `new_values`: jsonb
- `created_at`: timestamptz

---

## 6. Relationships & Constraints

1. **Multi-Tenancy**: Every table (except `profiles` and `business_profile`) MUST have a `business_id` column with an index.
2. **RLS Policies**:
   - `SELECT`: `business_id = current_setting('app.current_business_id')::uuid`
   - `INSERT/UPDATE/DELETE`: Same as SELECT, plus role checks.
3. **Unique Constraints**:
   - `product_barcodes`: Unique on `(business_id, barcode)`.
   - `products`: Unique on `(business_id, syrve_product_id)`.
   - `syrve_config`: Unique on `business_id`.
