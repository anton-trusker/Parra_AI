# 02 — Database Schema Reference

**Complete PostgreSQL Schema for Wine Inventory Platform**

This document provides the authoritative database schema for the Supabase backend, optimized for single-client deployment.

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Extensions \u0026 Types](#extensions--types)
3. [Layer 1: User \u0026 Auth](#layer-1-user--auth)
4. [Layer 2: Settings \u0026 Configuration](#layer-2-settings--configuration)
5. [Layer 3: Syrve Integration](#layer-3-syrve-integration)
6. [Layer 4: Catalog \u0026 Organization](#layer-4-catalog--organization)
7. [Layer 5: Enrichment](#layer-5-enrichment)
8. [Layer 6: Media \u0026 AI](#layer-6-media--ai)
9. [Layer 7: Inventory Management](#layer-7-inventory-management)
10. [Entity Relationship Diagram](#entity-relationship-diagram)
11. [Indexes \u0026 Performance](#indexes--performance)

---

## Schema Overview

### **Design Principles**

1. **Single-Client Optimized**: No `business_id` columns; one business per Supabase project
2. **Syrve-First**: Master data pulled from Syrve, enriched locally
3. **Event-Sourced Inventory**: Append-only events with materialized aggregates
4. **Vector Search**: pgvector for AI-powered label matching
5. **Singleton Tables**: Single-row configuration tables (business_profile, app_settings, etc.)

### **Naming Conventions**

| Convention | Example |
|------------|---------|
| **Primary Keys** | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| **Foreign Keys** | `product_id UUID REFERENCES products(id)` |
| **Timestamps** | `created_at TIMESTAMPTZ DEFAULT NOW()` |
| **Booleans** | `is_active`, `is_deleted`, `is_primary` |
| **JSON** | `JSONB` for flexible metadata |
| **Syrve IDs** | `syrve_product_id UUID` (Syrve returns UUIDs) |

### **Layer Organization**

```
Layer 1: User \u0026 Auth
  └─ profiles, roles, user_roles
  
Layer 2: Settings \u0026 Configuration
  └─ business_profile, app_settings, ai_config, syrve_config
  
Layer 3: Syrve Integration
  └─ syrve_raw_objects, syrve_sync_runs, syrve_api_logs, syrve_outbox_jobs
  
Layer 4: Catalog \u0026 Organization
  └─ org_nodes, stores, categories, products, product_barcodes
  
Layer 5: Enrichment
  └─ wines, glass_dimensions, bottle_sizes, product_serving_rules, product_traits
  
Layer 6: Media \u0026 AI
  └─ media_assets, product_assets, ai_runs, ai_match_candidates, ai_feedback, product_search_index
  
Layer 7: Inventory Management
  └─ inventory_sessions, inventory_baseline_items, inventory_count_events, inventory_product_aggregates, inventory_variances
```

---

## Extensions \u0026 Types

### **Required PostgreSQL Extensions**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption + UUID v4
CREATE EXTENSION IF NOT EXISTS "pgvector";       -- Vector similarity search
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";  -- Fuzzy string matching (optional)
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- GIN indexes for JSONB
```

### **Custom Types**

```sql
-- Permission levels for RBAC
CREATE TYPE permission_level AS ENUM ('none', 'view', 'edit', 'full');

-- Inventory session statuses
CREATE TYPE inventory_session_status AS ENUM (
    'draft',           -- Created but not started
    'in_progress',     -- Staff counting
    'pending_review',  -- Ready for manager review
    'approved',        -- Manager approved
    'synced',          -- Successfully sent to Syrve
    'cancelled',       -- Cancelled before completion
    'flagged'          -- Has issues requiring attention
);

-- Inventory session types
CREATE TYPE inventory_session_type AS ENUM ('full', 'partial', 'cycle', 'receiving');

-- Counting methods
CREATE TYPE counting_method AS ENUM ('manual', 'barcode', 'image_ai', 'voice', 'manager_adjustment');

-- Sync statuses
CREATE TYPE sync_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Sync types
CREATE TYPE sync_type AS ENUM ('products', 'stock', 'orders', 'full');

-- API request types
CREATE TYPE api_request_type AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

-- AI recognition statuses
CREATE TYPE recognition_status AS ENUM ('pending', 'processing', 'success', 'failed', 'timeout');
```

---

## Layer 1: User \u0026 Auth

### **`profiles`**

Extends `auth.users` with application-specific user data.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    login_name TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_login_name ON profiles(login_name);
CREATE INDEX idx_profiles_active ON profiles(is_active);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | FK to `auth.users.id` |
| `full_name` | TEXT | Display name |
| `email` | TEXT | Optional email mirror |
| `login_name` | TEXT | For username/password login (unique) |
| `avatar_url` | TEXT | Profile picture |
| `is_active` | BOOLEAN | Account status |
| `metadata` | JSONB | Flexible user metadata |

### **`roles`**

Role definitions with JSONB permissions.

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roles_system ON roles(is_system_role);
CREATE INDEX idx_roles_super_admin ON roles(is_super_admin);

-- Default roles
INSERT INTO roles (name, description, permissions, is_system_role, is_super_admin) VALUES
    ('Super Admin', 'Full system access', '{"*": "full"}', true, true),
    ('Admin', 'System administration', '{"users": "full", "catalog": "full", "inventory": "full", "integrations": "full"}', true, false),
    ('Manager', 'Inventory and catalog management', '{"catalog": "full", "inventory": "full", "users": "view"}', true, false),
    ('Staff', 'Basic inventory operations', '{"catalog": "view", "inventory": "edit"}', true, false);
```

| Column | Type | Description |
|--------|------|-------------|
| `name` | TEXT | Role name (e.g., "Manager") |
| `permissions` | JSONB | Permission map: `{"module.action": "level"}` |
| `is_system_role` | BOOLEAN | Cannot be deleted |
| `is_super_admin` | BOOLEAN | Bypass all RLS |

### **`user_roles`**

User-to-role assignments (many-to-many).

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

---

## Layer 2: Settings \u0026 Configuration

### **`business_profile`** (Singleton)

Single business settings (1 row only).

```sql
CREATE TABLE business_profile (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    name TEXT NOT NULL,
    legal_name TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',
    language TEXT NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert singleton row
INSERT INTO business_profile (id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, 'Wine Restaurant')
ON CONFLICT (id) DO NOTHING;
```

### **`app_settings`** (Singleton)

Application-wide settings (1 row only).

```sql
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    inventory_requires_approval BOOLEAN NOT NULL DEFAULT true,
    ai_recognition_enabled BOOLEAN NOT NULL DEFAULT true,
    default_glass_id UUID REFERENCES glass_dimensions(id),
    default_bottle_size_ml NUMERIC,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (id) VALUES ('00000000-0000-0000-0000-000000000001'::UUID)
ON CONFLICT (id) DO NOTHING;
```

### **`ai_config`** (Singleton)

AI provider configuration (1 row only).

```sql
CREATE TABLE ai_config (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    ocr_provider TEXT NOT NULL DEFAULT 'google_vision',
    vision_provider TEXT NOT NULL DEFAULT 'gemini',
    embedding_provider TEXT NOT NULL DEFAULT 'openai',
    use_system_key BOOLEAN NOT NULL DEFAULT true,
    custom_api_key_encrypted TEXT,
    model_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_config (id) VALUES ('00000000-0000-0000-0000-000000000001'::UUID)
ON CONFLICT (id) DO NOTHING;
```

### **`syrve_config`** (Singleton)

Syrve POS connection settings (1 row only).

```sql
CREATE TABLE syrve_config (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    server_url TEXT NOT NULL,
    api_login TEXT NOT NULL,
    api_password_encrypted TEXT NOT NULL,
    default_store_id UUID,
    default_department_id UUID,
    selected_category_ids UUID[],
    connection_status TEXT NOT NULL DEFAULT 'disconnected',
    connection_tested_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    sync_lock_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO syrve_config (id, server_url, api_login, api_password_encrypted) VALUES 
    ('00000000-0000-0000-0000-000000000001'::UUID, '', '', '')
ON CONFLICT (id) DO NOTHING;
```

---

## Layer 3: Syrve Integration

### **`syrve_config`**

**Purpose:** Central Syrve server connection configuration (singleton table).

**Design:** Enforces single-row constraint - one Syrve configuration per deployment.

```sql
CREATE TABLE syrve_config (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    server_url TEXT NOT NULL,
    api_login TEXT NOT NULL,
    api_password_encrypted TEXT NOT NULL,  -- Use Supabase Vault or pgcrypto
    default_store_id UUID,
    default_department_id UUID,
    selected_category_ids UUID[],  -- Optional product group filter
    account_surplus_code TEXT DEFAULT '5.10',
    account_shortage_code TEXT DEFAULT '5.09',
    connection_status TEXT NOT NULL DEFAULT 'disconnected',  -- 'connected'|'disconnected'|'error'
    connection_tested_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    sync_lock_until TIMESTAMPTZ,  -- Prevents concurrent syncs
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT enforce_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'::UUID)
);

CREATE INDEX idx_syrve_config_status ON syrve_config(connection_status);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Fixed singleton ID |
| `server_url` | TEXT | Syrve server URL (e.g., `http://192.168.1.100:8080`) |
| `api_login` | TEXT | Syrve API username |
| `api_password_encrypted` | TEXT | Encrypted password (use Supabase Vault) |
| `default_store_id` | UUID | Selected Syrve store for operations |
| `default_department_id` | UUID | Optional department filter |
| `selected_category_ids` | UUID[] | Optional product group filter |
| `account_surplus_code` | TEXT | Syrve GL account for inventory surplus |
| `account_shortage_code` | TEXT | Syrve GL account for inventory shortage |
| `connection_status` | TEXT | Connection health: connected/disconnected/error |
| `connection_tested_at` | TIMESTAMPTZ | Last successful connection test |
| `last_sync_at` | TIMESTAMPTZ | Last product sync timestamp |
| `sync_lock_until` | TIMESTAMPTZ | Sync lock to prevent concurrent operations |

**Security:**
```sql
-- Use Supabase Vault for password encryption
SELECT vault.create_secret(password_text, 'syrve_api_password');

-- Decrypt in Edge Functions
SELECT decrypted_secret FROM vault.decrypted_secrets 
WHERE name = 'syrve_api_password';
```

**RLS Policies:**
```sql
-- Only authenticated users can view
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syrve_config_select" ON syrve_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify
CREATE POLICY "syrve_config_update" ON syrve_config
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

---



### **`syrve_raw_objects`**

Loss less mirror of all Syrve API responses.

```sql
CREATE TABLE syrve_raw_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,  -- 'department', 'store', 'product', 'group'
    syrve_id UUID NOT NULL,
    payload JSONB NOT NULL,
    payload_hash TEXT NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    UNIQUE(entity_type, syrve_id, payload_hash)
);

CREATE INDEX idx_syrve_raw_entity_type ON syrve_raw_objects(entity_type);
CREATE INDEX idx_syrve_raw_syrve_id ON syrve_raw_objects(syrve_id);
```

### **`syrve_sync_runs`**

Sync job tracking.

```sql
CREATE TABLE syrve_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL,  -- 'bootstrap', 'products_sync', 'stock_snapshot'
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'success', 'failed'
    stats JSONB NOT NULL DEFAULT '{}',
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX idx_syrve_sync_runs_status ON syrve_sync_runs(status);
CREATE INDEX idx_syrve_sync_runs_type ON syrve_sync_runs(run_type);
```

### **`syrve_outbox_jobs`**

Reliable export queue for inventory submission.

```sql
CREATE TABLE syrve_outbox_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,  -- 'inventory_check', 'inventory_commit'
    payload_xml TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'success', 'failed'
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    last_attempt_at TIMESTAMPTZ,
    response_xml TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(job_type, payload_hash)  -- Idempotency
);

CREATE INDEX idx_syrve_outbox_status ON syrve_outbox_jobs(status);
CREATE INDEX idx_syrve_outbox_session ON syrve_outbox_jobs(session_id);
```

---

### **`syrve_api_logs`**

**Purpose:** Detailed request/response logging for Syrve API debugging.

**Retention:** Consider partitioning by month with 30-day TTL.

```sql
CREATE TABLE syrve_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,  -- 'AUTH'|'FETCH_PRODUCTS'|'STOCK_SNAPSHOT'|'INV_COMMIT'
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
    request_payload TEXT,
    response_payload TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syrve_api_logs_action_status 
  ON syrve_api_logs(action_type, status, created_at DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| `action_type` | TEXT | Operation: AUTH, FETCH_PRODUCTS, STOCK_SNAPSHOT, etc. |
| `status` | TEXT | Result: success/error/timeout |
| `request_payload` | TEXT | Full request body (XML/JSON) |
| `response_payload` | TEXT | Full response body |
| `error_message` | TEXT | Error details if failed |
| `duration_ms` | INTEGER | Request duration in milliseconds |

**Data Retention Policy:**
```sql
-- Delete logs older than 30 days (run via cron)
DELETE FROM syrve_api_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Layer 4: Catalog \u0026 Organization

### **`stores`**

Syrve store/location mappings.

```sql
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_store_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_syrve_id ON stores(syrve_store_id);
```

### **`categories`**

Product groups/categories from Syrve.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_group_id UUID NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_in_scope BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    default_glass_id UUID REFERENCES glass_dimensions(id),
    synced_at TIMESTAMPTZ,
    syrve_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_syrve_id ON categories(syrve_group_id);
CREATE INDEX idx_categories_active ON categories(is_active);
```

### **`products`**

Canonical Syrve product catalog.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_product_id UUID NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    code TEXT,
    product_type TEXT,
    unit_name TEXT,
    unit_capacity_liters NUMERIC,
    default_sale_price NUMERIC,
    not_in_store_movement BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_countable BOOLEAN NOT NULL DEFAULT true,
    par_level NUMERIC,
    default_location TEXT,
    stock_status TEXT,
    synced_at TIMESTAMPTZ,
    syrve_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_syrve_id ON products(syrve_product_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_active ON products(is_active);
```

### **`product_barcodes`**

Product barcode mappings.

```sql
CREATE TABLE product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'syrve',  -- 'syrve', 'manual', 'ai'
    confidence NUMERIC,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_barcodes_product ON product_barcodes(product_id);
CREATE INDEX idx_product_barcodes_barcode ON product_barcodes(barcode);
```

---

## Layer 5: Enrichment

### **`wines`**

Wine-specific product enrichment (1:1 with products).

```sql
CREATE TABLE wines (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    producer TEXT,
    vintage INTEGER,
    country TEXT,
    region TEXT,
    appellation TEXT,
    alcohol_content NUMERIC,
    volume_ml NUMERIC,
    tasting_notes TEXT,
    grape_varieties JSONB NOT NULL DEFAULT '[]',
    tags JSONB NOT NULL DEFAULT '[]',
    critic_scores JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_wines_vintage ON wines(vintage);
CREATE INDEX idx_wines_country ON wines(country);
```

### **`glass_dimensions`**

Glass pour sizes.

```sql
CREATE TABLE glass_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    capacity_ml NUMERIC NOT NULL CHECK (capacity_ml > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### **`bottle_sizes`**

Bottle volume options.

```sql
CREATE TABLE bottle_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ml NUMERIC NOT NULL UNIQUE CHECK (ml > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### **`product_serving_rules`**

Glass pour and serving configuration.

```sql
CREATE TABLE product_serving_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    category_id UUID REFERENCES categories(id),
    sold_by_glass BOOLEAN NOT NULL DEFAULT false,
    glass_dimension_id UUID REFERENCES glass_dimensions(id),
    bottle_size_ml NUMERIC,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CHECK (product_id IS NOT NULL OR category_id IS NOT NULL)
);
```

---

## Layer 6: Media \u0026 AI

### **`media_assets`**

Media file metadata.

```sql
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket TEXT NOT NULL,
    path TEXT NOT NULL,
    public_url TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    width INTEGER,
    height INTEGER,
    hash TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(bucket, path)
);
```

### **`ai_runs`**

AI recognition attempts audit trail.

```sql
CREATE TABLE ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL,  -- 'label_recognition', 'ocr', 'embedding_match'
    status TEXT NOT NULL,  -- 'queued', 'running', 'succeeded', 'failed'
    model_name TEXT,
    model_version TEXT,
    input_asset_id UUID REFERENCES media_assets(id),
    confidence NUMERIC,
    result JSONB NOT NULL DEFAULT '{}',
    duration_ms INTEGER,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_runs_status ON ai_runs(status);
CREATE INDEX idx_ai_runs_type ON ai_runs(run_type);
```

### **`product_search_index`** (pgvector)

Product embeddings for vector similarity search.

```sql
CREATE TABLE product_search_index (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    search_text TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector similarity index (choose IVFFlat or HNSW based on dataset size)
CREATE INDEX idx_product_search_embedding ON product_search_index 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Layer 7: Inventory Management

### **`inventory_sessions`**

Inventory counting session container.

```sql
CREATE TABLE inventory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    status inventory_session_status NOT NULL DEFAULT 'draft',
    title TEXT,
    comment TEXT,
    baseline_source TEXT NOT NULL DEFAULT 'syrve_stock_snapshot',
    baseline_taken_at TIMESTAMPTZ,
    manager_only_expected BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    syrve_document_id TEXT,
    syrve_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_inventory_sessions_store ON inventory_sessions(store_id);
```

### **`inventory_baseline_items`**

Immutable manager-only baseline (expected stock from Syrve).

```sql
CREATE TABLE inventory_baseline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    expected_qty_unopened NUMERIC NOT NULL DEFAULT 0,
    expected_open_liters NUMERIC NOT NULL DEFAULT 0,
    expected_total_liters NUMERIC,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(session_id, product_id)
);

CREATE INDEX idx_inventory_baseline_session ON inventory_baseline_items(session_id);
CREATE INDEX idx_inventory_baseline_product ON inventory_baseline_items(product_id);
```

### **`inventory_count_events`**

Append-only counting event log.

```sql
CREATE TABLE inventory_count_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    counted_by UUID NOT NULL REFERENCES profiles(id),
    bottles_unopened NUMERIC NOT NULL DEFAULT 0,
    open_ml NUMERIC NOT NULL DEFAULT 0,
    open_liters NUMERIC GENERATED ALWAYS AS (open_ml / 1000.0) STORED,
    method counting_method NOT NULL DEFAULT 'manual',
    confidence NUMERIC,
    ai_run_id UUID REFERENCES ai_runs(id),
    asset_id UUID REFERENCES media_assets(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_count_events_session ON inventory_count_events(session_id);
CREATE INDEX idx_inventory_count_events_product ON inventory_count_events(product_id);
CREATE INDEX idx_inventory_count_events_counted_by ON inventory_count_events(counted_by);
```

### **`inventory_product_aggregates`**

Materialized totals for performance.

```sql
CREATE TABLE inventory_product_aggregates (
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    counted_unopened_total NUMERIC NOT NULL DEFAULT 0,
    counted_open_liters_total NUMERIC NOT NULL DEFAULT 0,
    counted_total_liters NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (session_id, product_id)
);

CREATE INDEX idx_inventory_aggregates_session ON inventory_product_aggregates(session_id);
CREATE INDEX idx_inventory_aggregates_product ON inventory_product_aggregates(product_id);
```

---

## Entity Relationship Diagram

```
profiles ──┬─── user_roles ──┬─── roles
           │                  
           ├─── inventory_sessions ──┬─── inventory_baseline_items
           │                         ├─── inventory_count_events
           │                         ├─── inventory_product_aggregates
           │                         └─── syrve_outbox_jobs
           │
           ├─── ai_runs ──┬─── ai_match_candidates ──┤
           │              └─── ai_feedback           │
           │                                         │
           └─── media_assets ──┬─── product_assets ──┤
                               │                     │
stores ──┬─── inventory_sessions                    │
         │                                           │
categories ──┬─── products ──┬──────────────────────┤
             │               ├─── wines              │
             │               ├─── product_barcodes   │
             │               ├─── product_assets     │
             │               ├─── product_serving_rules
             │               ├─── product_traits     │
             │               └─── product_search_index
             │
             └─── product_serving_rules

syrve_config (singleton)
business_profile (singleton)
app_settings (singleton)
ai_config (singleton)

syrve_raw_objects
syrve_sync_runs
syrve_api_logs
```

---

## Indexes \u0026 Performance

### **Composite Indexes**

```sql
-- Fast lookup for counting events by session + product
CREATE INDEX idx_count_events_composite ON inventory_count_events(session_id, product_id, created_at DESC);

-- Product search by category + active status
CREATE INDEX idx_products_category_active ON products(category_id, is_active);

-- Syrve sync lookup
CREATE INDEX idx_syrve_raw_composite ON syrve_raw_objects(entity_type, syrve_id);
```

### **JSONB Indexes**

```sql
-- Full-text search on product metadata
CREATE INDEX idx_products_metadata_gin ON products USING GIN (metadata);

-- Permission search in roles
CREATE INDEX idx_roles_permissions_gin ON roles USING GIN (permissions);
```

### **Performance Tips**

1. **Use materialized views** for complex aggregations (see below)
2. **Partition large tables** (inventory_count_events) if > 10M rows
3. **Regular VACUUM ANALYZE** for query planner stats
4. **Monitor pgvector index** performance and adjust `lists` parameter
5. **Use prepared statements** in Edge Functions
6. **Enable connection pooling** (Supabase default: pgBouncer)

---

## Performance Optimization

### **Materialized Views for Fast Aggregations**

#### **Inventory Session Summary View**

Materialized view for session-level inventory analytics:

```sql
CREATE MATERIALIZED VIEW inventory_session_summary AS
SELECT 
    s.id AS session_id,
    s.store_id,
    s.status,
    s.title,
    s.created_by,
    COUNT(DISTINCT ice.product_id) AS products_counted,
    SUM(ice.bottles_unopened) AS total_bottles_counted,
    SUM(ice.open_liters) AS total_open_liters_counted,
    COUNT(ice.id) AS total_count_events,
    MIN(ice.created_at) AS first_count_at,
    MAX(ice.created_at) AS last_count_at,
    COUNT(DISTINCT ice.counted_by) AS counters_involved,
    s.created_at,
    s.completed_at
FROM inventory_sessions s
LEFT JOIN inventory_count_events ice ON ice.session_id = s.id
WHERE s.status IN ('in_progress', 'pending_review', 'approved', 'synced')
GROUP BY s.id, s.store_id, s.status, s.title, s.created_by, s.created_at, s.completed_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_inventory_session_summary_id ON inventory_session_summary(session_id);

-- Refresh strategy: after session status changes
-- REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_session_summary;
```

**Usage Benefits**:
- Fast dashboard queries for session metrics
- No need to aggregate thousands of count events on every page load
- Supports concurrent refresh (non-blocking)

### **Aggregate Refresh Function**

Automatically refresh `inventory_product_aggregates` table:

```sql
CREATE OR REPLACE FUNCTION refresh_inventory_aggregates(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete existing aggregates for this session
    DELETE FROM inventory_product_aggregates 
    WHERE session_id = p_session_id;
    
    -- Insert fresh aggregates from count events
    INSERT INTO inventory_product_aggregates (
        session_id,
        product_id,
        counted_unopened_total,
        counted_open_liters_total,
        counted_total_liters,
        updated_at
    )
    SELECT 
        session_id,
        product_id,
        SUM(bottles_unopened) AS counted_unopened_total,
        SUM(open_liters) AS counted_open_liters_total,
        SUM(bottles_unopened * p.unit_capacity_liters) + SUM(open_liters) AS counted_total_liters,
        NOW() AS updated_at
    FROM inventory_count_events ice
    JOIN products p ON p.id = ice.product_id
    WHERE session_id = p_session_id
    GROUP BY session_id, product_id;
    
    -- Update session updated_at timestamp
    UPDATE inventory_sessions 
    SET updated_at = NOW() 
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION refresh_inventory_aggregates(UUID) TO authenticated;
```

**Usage**:
```sql
-- Call after adding/modifying count events
SELECT refresh_inventory_aggregates('session-uuid-here');
```

### **Fuzzy Product Matching Function**

Intelligent product matching for Syrve synchronization:

```sql
CREATE OR REPLACE FUNCTION find_syrve_product_match(
    p_syrve_name TEXT,
    p_syrve_sku TEXT,
    p_syrve_barcode TEXT
)
RETURNS TABLE (
    product_id UUID,
    confidence_score NUMERIC,
    match_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        CASE 
            -- Exact barcode match (highest confidence)
            WHEN pb.barcode = p_syrve_barcode AND p_syrve_barcode IS NOT NULL THEN 1.0
            -- Exact SKU match
            WHEN p.sku = p_syrve_sku AND p_syrve_sku IS NOT NULL THEN 0.95
            -- High name similarity (fuzzy)
            WHEN similarity(p.name, p_syrve_name) > 0.8 THEN 0.75
            -- Medium name similarity
            WHEN similarity(p.name, p_syrve_name) > 0.6 THEN 0.50
            ELSE 0.0
        END AS confidence_score,
        CASE 
            WHEN pb.barcode = p_syrve_barcode AND p_syrve_barcode IS NOT NULL THEN 'barcode_exact'
            WHEN p.sku = p_syrve_sku AND p_syrve_sku IS NOT NULL THEN 'sku_exact'
            WHEN similarity(p.name, p_syrve_name) > 0.8 THEN 'name_high_similarity'
            WHEN similarity(p.name, p_syrve_name) > 0.6 THEN 'name_medium_similarity'
            ELSE 'no_match'
        END AS match_reason
    FROM products p
    LEFT JOIN product_barcodes pb ON pb.product_id = p.id
    WHERE p.is_active = true
    AND p.is_deleted = false
    AND (
        pb.barcode = p_syrve_barcode 
        OR p.sku = p_syrve_sku 
        OR similarity(p.name, p_syrve_name) > 0.6
    )
    ORDER BY confidence_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Requires fuzzystrmatch extension
-- CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION find_syrve_product_match(TEXT, TEXT, TEXT) TO service_role;
```

**Usage in Edge Functions**:
```typescript
const { data: matches } = await supabase
  .rpc('find_syrve_product_match', {
    p_syrve_name: 'Chateau Margaux 2015',
    p_syrve_sku: 'MAR2015',
    p_syrve_barcode: '1234567890123'
  });

if (matches[0]?.confidence_score >= 0.75) {
  // High confidence match found
  const matchedProduct = matches[0];
}
```

### **Index Strategy for Single-Tenant**

Since this is a single-tenant deployment, indexes are simplified (no composite `(business_id, ...)` needed):

```sql
-- Single-tenant optimized indexes (already defined above)
-- All foreign key columns automatically indexed
-- Additional performance indexes:

-- Fast barcode lookup across all products
CREATE INDEX idx_product_barcodes_lookup 
ON product_barcodes(barcode) 
WHERE is_primary = true;

-- Fast active wine product query
CREATE INDEX idx_wines_active 
ON wines(product_id) 
WHERE is_active = true;

-- Fast session lookup by status
CREATE INDEX idx_inventory_sessions_active 
ON inventory_sessions(status, created_at DESC) 
WHERE status IN ('draft', 'in_progress', 'pending_review');
```

### **Query Optimization Patterns**

#### **Event-Sourced Aggregation Pattern**

Instead of repeatedly aggregating count events:

```sql
-- ❌ SLOW: Aggregating on every query
SELECT 
    product_id,
    SUM(bottles_unopened) AS total
FROM inventory_count_events
WHERE session_id = 'some-uuid'
GROUP BY product_id;

-- ✅ FAST: Use pre-computed aggregates
SELECT 
    product_id,
    counted_unopened_total,
    counted_open_liters_total,
    counted_total_liters
FROM inventory_product_aggregates
WHERE session_id = 'some-uuid';
```

#### **Efficient Product Search with Vector**

```sql
-- Vector similarity search for AI label matching
SELECT 
    p.id,
    p.name,
    1 - (psi.embedding <=> query_embedding) AS similarity
FROM product_search_index psi
JOIN products p ON p.id = psi.product_id
WHERE p.is_active = true
ORDER BY psi.embedding <=> query_embedding
LIMIT 10;
```

---

## Next Steps

- Review [03-authentication.md](03-authentication.md) for RLS policies
- Study [04-syrve-integration.md](04-syrve-integration.md) for sync logic
- Examine [07-inventory-management.md](07-inventory-management.md) for event sourcing details
