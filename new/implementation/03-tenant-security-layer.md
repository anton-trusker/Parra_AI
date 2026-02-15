# 03 — Tenant & Security Layer

## Overview

Multi-tenant isolation using `tenant_id` on all tables. Every query is automatically scoped to the user's tenant via RLS helper functions.

## Tables

### tenants

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,

  -- Billing
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  billing_email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Usage tracking
  monthly_ai_scans_used INTEGER DEFAULT 0,
  monthly_ai_scans_limit INTEGER DEFAULT 0,
  monthly_ai_scans_reset_at TIMESTAMPTZ,

  -- Settings
  country TEXT DEFAULT 'PT',
  currency TEXT DEFAULT 'EUR',
  timezone TEXT DEFAULT 'Europe/Lisbon',
  locale TEXT DEFAULT 'pt-PT',

  -- Status
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_tenants_active ON tenants(is_active, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_billing ON tenants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
```

### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,

  role app_role NOT NULL DEFAULT 'staff',

  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id, is_active);
CREATE INDEX idx_profiles_role ON profiles(tenant_id, role);
```

### app_settings

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);
```

### tenant_modules

```sql
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}'
);
```

## Helper Functions

```sql
-- Get user's tenant_id
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is owner or admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is at least manager
CREATE OR REPLACE FUNCTION auth.is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

## RLS Patterns

```sql
-- Pattern 1: Tenant-scoped read (all authenticated users)
CREATE POLICY "tenant_read" ON <table>
FOR SELECT USING (tenant_id = auth.get_user_tenant_id());

-- Pattern 2: Admin-only write
CREATE POLICY "admin_write" ON <table>
FOR ALL USING (auth.is_admin() AND tenant_id = auth.get_user_tenant_id());

-- Pattern 3: Staff insert during active session
CREATE POLICY "staff_count" ON inventory_count_events
FOR INSERT WITH CHECK (
  tenant_id = auth.get_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM inventory_sessions
    WHERE id = session_id AND status = 'in_progress'
  )
);

-- Pattern 4: Manager-only visibility
CREATE POLICY "manager_baseline" ON inventory_baseline_items
FOR SELECT USING (
  (auth.has_role('manager') OR auth.is_admin())
  AND tenant_id = auth.get_user_tenant_id()
);
```
