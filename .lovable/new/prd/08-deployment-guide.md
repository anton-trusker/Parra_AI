# 08 — Deployment Guide

**Complete Setup and Deployment for Wine Inventory Platform**

This document provides step-by-step instructions for deploying the platform to Supabase.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Migration](#database-migration)
4. [Storage Configuration](#storage-configuration)
5. [Edge Functions Deployment](#edge-functions-deployment)
6. [Environment Variables](#environment-variables)
7. [Frontend Deployment](#frontend-deployment)
8. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### **Required Accounts**

- [ ] Supabase account (https://supabase.com)
- [ ] Google Cloud account (for Vision API)
- [ ] OpenAI account (for embeddings)
- [Google AI account (for Gemini API)
- [ ] Syrve Server access credentials

### **Local Development Tools**

```bash
# Install Node.js 18+
node --version  # v18.0.0 or higher

# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### **Repository Clone**

```bash
git clone https://github.com/YOUR_ORG/inventory-platform.git
cd inventory-platform
npm install
```

---

## Supabase Project Setup

### **1. Create New Project**

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `wine-inventory-prod`
   - **Database Password**: Generate strong password (save securely!)
   - **Region**: Choose closest to your location
4. Wait ~2 minutes for provisioning

### **2. Get Project Credentials**

Navigate to **Settings > API**:

```bash
# Save these values:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. Link Local Project**

```bash
supabase login
supabase link --project-ref xxxxx
```

---

## Database Migration

### **1. Enable Extensions**

Connect to SQL Editor in Supabase Dashboard:

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### **2. Run Migration Script**

Create `supabase/migrations/00_initial_schema.sql`:

```sql
-- ========================================
-- MIGRATION: Initial Schema
-- ========================================

-- Custom types
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE inventory_session_status AS ENUM (
    'draft', 'in_progress', 'pending_review', 
    'approved', 'flagged', 'cancelled', 'synced'
);

-- 1. User & Auth Schema
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login_name TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 2. Settings Schema
CREATE TABLE business_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    logo_asset_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE syrve_config (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
    server_url TEXT NOT NULL,
    api_login TEXT NOT NULL,
    api_password_encrypted TEXT NOT NULL,
    default_store_id UUID,
    default_department_id UUID,
    selected_category_ids UUID[],
    account_surplus_code TEXT DEFAULT '5.10',
    account_shortage_code TEXT DEFAULT '5.09',
    connection_status TEXT NOT NULL DEFAULT 'disconnected',
    connection_tested_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    sync_lock_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT enforce_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'::UUID)
);

CREATE TABLE syrve_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    status TEXT NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Syrve Integration Schema
CREATE TABLE syrve_raw_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    syrve_id UUID NOT NULL,
    payload JSONB NOT NULL,
    payload_hash TEXT NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entity_type, syrve_id, payload_hash)
);

CREATE TABLE syrve_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    stats JSONB DEFAULT '{}',
    error_details TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE syrve_outbox_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    job_type TEXT NOT NULL,
    payload_xml TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT DEFAULT 0,
    response_xml TEXT,
    last_error TEXT,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (job_type, payload_hash)
);

-- 4. Catalog Schema
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    code TEXT,
    is_active BOOLEAN DEFAULT true,
    synced_at TIMESTAMPTZ,
    syrve_data JSONB DEFAULT '{}'
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_group_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    synced_at TIMESTAMPTZ
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_product_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    code TEXT,
    category_id UUID REFERENCES categories(id),
    product_type TEXT,
    unit_capacity_liters NUMERIC,
    default_sale_price NUMERIC,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    synced_at TIMESTAMPTZ,
    syrve_data JSONB DEFAULT '{}'
);

CREATE TABLE product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL UNIQUE
);

-- 5. Enrichment Schema
CREATE TABLE wines (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    producer TEXT,
    region TEXT,
    appellation TEXT,
    vintage INT,
    grape_varieties TEXT[],
    alcohol_content NUMERIC,
    color TEXT,
    type TEXT
);

-- 6. Media & AI Schema
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes INT,
    mime_type TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    input_asset_id UUID REFERENCES media_assets(id),
    confidence NUMERIC,
    result JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_match_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_run_id UUID REFERENCES ai_runs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    score NUMERIC NOT NULL,
    rank INT NOT NULL
);

CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_run_id UUID REFERENCES ai_runs(id),
    chosen_product_id UUID REFERENCES products(id),
    chosen_by UUID REFERENCES profiles(id),
    feedback_type TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_search_index (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    search_text TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_search_embedding ON product_search_index 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 7. Inventory Schema
CREATE TABLE inventory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    title TEXT NOT NULL,
    comment TEXT,
    status inventory_session_status DEFAULT 'draft',
    baseline_taken_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    syrve_document_id UUID,
    syrve_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_baseline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    expected_qty_unopened NUMERIC DEFAULT 0,
    expected_open_liters NUMERIC DEFAULT 0,
    expected_total_liters NUMERIC GENERATED ALWAYS AS (
        expected_qty_unopened * 0.75 + expected_open_liters
    ) STORED,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, product_id)
);

CREATE TABLE inventory_count_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    counted_by UUID REFERENCES profiles(id),
    bottles_unopened NUMERIC DEFAULT 0,
    open_ml NUMERIC DEFAULT 0,
    open_liters NUMERIC GENERATED ALWAYS AS (open_ml / 1000.0) STORED,
    method TEXT DEFAULT 'manual',
    confidence NUMERIC,
    ai_run_id UUID REFERENCES ai_runs(id),
    asset_id UUID REFERENCES media_assets(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_product_aggregates (
    session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    counted_unopened_total NUMERIC DEFAULT 0,
    counted_open_liters_total NUMERIC DEFAULT 0,
    counted_total_liters NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (session_id, product_id)
);

-- Trigger to update aggregates
CREATE OR REPLACE FUNCTION refresh_product_aggregate()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory_product_aggregates (session_id, product_id, counted_unopened_total, counted_open_liters_total, counted_total_liters)
    SELECT
        NEW.session_id,
        NEW.product_id,
        SUM(bottles_unopened),
        SUM(open_liters),
        SUM(bottles_unopened * COALESCE(p.unit_capacity_liters, 0.75) + open_liters)
    FROM inventory_count_events ice
    JOIN products p ON p.id = ice.product_id
    WHERE ice.session_id = NEW.session_id AND ice.product_id = NEW.product_id
    GROUP BY NEW.session_id, NEW.product_id
    ON CONFLICT (session_id, product_id)
    DO UPDATE SET
        counted_unopened_total = EXCLUDED.counted_unopened_total,
        counted_open_liters_total = EXCLUDED.counted_open_liters_total,
        counted_total_liters = EXCLUDED.counted_total_liters,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aggregates_on_count
    AFTER INSERT ON inventory_count_events
    FOR EACH ROW
    EXECUTE FUNCTION refresh_product_aggregate();

-- 8. Seed Data: Default Roles
INSERT INTO roles (name, description, permissions, is_system_role, is_super_admin) VALUES
('Super Admin', 'Platform owner with full access', '{"*": "full"}', true, true),
('Manager', 'Restaurant administrator', '{
  "catalog.view": "full",
  "catalog.edit": "full",
  "inventory.count": "full",
  "inventory.approve": "full",
  "inventory.view_expected": "full",
  "users.manage": "edit",
  "settings.configure": "edit"
}', true, false),
('Staff', 'Inventory counter', '{
  "catalog.view": "view",
  "inventory.count": "edit"
}', true, false);
```

**Run migration**:
```bash
supabase db push
```

---

## Storage Configuration

### **Create Buckets**

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('product-labels', 'product-labels', false),
('inventory-evidence', 'inventory-evidence', false),
('ai-scans', 'ai-scans', false),
('logos', 'logos', true),
('avatars', 'avatars', false);
```

### **Set Storage Policies**

See [03-authentication.md](03-authentication.md#storage-security) for complete RLS policies.

---

## Edge Functions Deployment

### **1. Configure Secrets**

```bash
# Google Vision API
supabase secrets set GOOGLE_VISION_API_KEY=your_key_here

# OpenAI (embeddings)
supabase secrets set OPENAI_API_KEY=your_key_here

# Google AI (Gemini)
supabase secrets set GEMINI_API_KEY=your_key_here
```

### **2. Deploy Functions**

```bash
# Deploy all functions
supabase functions deploy syrve-connect-test
supabase functions deploy syrve-bootstrap-sync
supabase functions deploy inventory-load-baseline
supabase functions deploy ai-scan
# ... deploy remaining functions
```

### **3. Test Functions**

```bash
# Test connection
curl -X POST \
  https://xxxxx.supabase.co/functions/v1/syrve-connect-test \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"server_url": "http://SERVER_IP:8080", "login": "api_user", "password": "pass"}'
```

---

## Environment Variables

### **Frontend (.env.local)**

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_VERSION=1.0.0
```

### **Edge Functions (Supabase Secrets)**

Already set via `supabase secrets set` above.

---

## Frontend Deployment

### **Option 1: Vercel**

```bash
vercel --prod
```

### **Option 2: Netlify**

```bash
netlify deploy --prod
```

### **Option 3: Static Hosting**

```bash
npm run build
# Upload dist/ to CDN
```

---

## Post-Deployment Checklist

### **Database**

- [ ] All migrations applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Storage buckets created with correct policies
- [ ] Default roles seeded (Super Admin, Manager, Staff)

### **Edge Functions**

- [ ] All functions deployed
- [ ] Secrets configured (Google Vision, OpenAI, Gemini)
- [ ] Test functions returning expected responses

### **Frontend**

- [ ] Build succeeds without errors
- [ ] Environment variables configured
- [ ] Can login with test user
- [ ] Can access all major features

### **Integration**

- [ ] Syrve connection test passes
- [ ] Bootstrap sync completes successfully
- [ ] Can create inventory session
- [ ] AI scan recognizes test label

### **Security**

- [ ] Service role key NOT exposed in frontend
- [ ] All sensitive data encrypted
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on auth endpoints

---

## Next Steps

- Review [09-api-reference.md](09-api-reference.md) for API documentation
- Study [03-authentication.md](03-authentication.md) for user management
- Monitor logs in Supabase Dashboard > Logs
