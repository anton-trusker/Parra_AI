# Phase 1: Database Setup

## Overview

This phase establishes the complete PostgreSQL database schema in Supabase, including all tables, enums, relationships, and constraints required for the Wine Inventory Management System.

---

## Prerequisites

- [ ] Supabase project created and connected
- [ ] Project URL and anon key configured in `.env.local`
- [ ] Supabase CLI installed (optional, for local development)

---

## Migration Files

Execute these migrations in order via Supabase Dashboard → SQL Editor.

### Migration 1: Core Enums

**File:** `001_create_enums.sql`

```sql
-- Wine type classification
CREATE TYPE wine_type_enum AS ENUM (
  'red', 'white', 'rose', 'sparkling', 
  'fortified', 'dessert', 'orange'
);

-- Session workflow status
CREATE TYPE session_status_enum AS ENUM (
  'draft', 'in_progress', 'pending_review', 
  'completed', 'cancelled', 'approved', 'flagged'
);

-- Stock movement types
CREATE TYPE movement_type_enum AS ENUM (
  'count_adjustment', 'sale', 'purchase', 
  'transfer', 'write_off', 'correction', 'breakage'
);

-- Wine counting methods
CREATE TYPE counting_method_enum AS ENUM (
  'manual', 'barcode', 'image_ai'
);

-- Bottle state tracking
CREATE TYPE bottle_state_enum AS ENUM (
  'unopened', 'opened'
);

-- User roles
CREATE TYPE app_role AS ENUM (
  'admin', 'staff'
);
```

---

### Migration 2: Reference Tables

**File:** `002_create_reference_tables.sql`

```sql
-- Wine Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wine Producers/Wineries
CREATE TABLE wine_producers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  country TEXT,
  region TEXT,
  website TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grape Varieties
CREATE TABLE grape_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT CHECK (color IN ('red', 'white')),
  origin_country TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Locations (cellars, storage areas)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT, -- cellar, warehouse, bar, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sub-Locations (racks, shelves)
CREATE TABLE sub_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Volume Options
CREATE TABLE volume_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- "750ml", "1.5L Magnum"
  ml INTEGER NOT NULL,
  bottle_size TEXT, -- standard, magnum, jeroboam
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Glass Pour Sizes
CREATE TABLE glass_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- "Standard", "Tasting"
  volume_litres NUMERIC(4,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Migration 3: Wines Table

**File:** `003_create_wines.sql`

```sql
CREATE TABLE wines (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL,
  full_name TEXT,
  producer TEXT,
  estate TEXT,
  producer_slug TEXT,
  
  -- Classification
  wine_type wine_type_enum,
  
  -- Vintage
  vintage INTEGER CHECK (vintage IS NULL OR (vintage >= 1900 AND vintage <= 2099)),
  is_non_vintage BOOLEAN DEFAULT false,
  bottling_date DATE,
  release_date DATE,
  optimal_drinking_start INTEGER,
  optimal_drinking_end INTEGER,
  aging_potential_years INTEGER,
  
  -- Geography
  country TEXT,
  country_code TEXT,
  region TEXT,
  sub_region TEXT,
  appellation TEXT,
  vineyard TEXT,
  terroir TEXT,
  
  -- Product Details
  volume_ml INTEGER DEFAULT 750,
  volume_label TEXT,
  bottle_size TEXT,
  alcohol_content NUMERIC(4,2),
  residual_sugar NUMERIC(6,2),
  total_acidity NUMERIC(4,2),
  ph_level NUMERIC(3,2),
  
  -- Closure & Packaging
  closure_type TEXT,
  bottle_color TEXT,
  capsule_type TEXT,
  label_design TEXT,
  
  -- Pricing
  purchase_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  retail_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  price_tier TEXT,
  glass_price NUMERIC(10,2),
  glass_pour_size_ml INTEGER,
  available_by_glass BOOLEAN DEFAULT false,
  
  -- Stock Management
  current_stock_unopened INTEGER DEFAULT 0,
  current_stock_opened INTEGER DEFAULT 0,
  min_stock_level INTEGER,
  max_stock_level INTEGER,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  stock_status TEXT DEFAULT 'in_stock',
  
  -- Internal Reference
  sku TEXT UNIQUE,
  internal_code TEXT,
  bin_location TEXT,
  cellar_section TEXT,
  rack_number TEXT,
  shelf_position TEXT,
  
  -- Supplier
  supplier_id UUID REFERENCES suppliers(id),
  supplier_sku TEXT,
  supplier_name TEXT,
  last_purchase_date DATE,
  last_purchase_quantity INTEGER,
  last_purchase_price NUMERIC(10,2),
  
  -- Tasting Notes
  tasting_notes TEXT,
  body TEXT,
  tannins TEXT,
  sweetness TEXT,
  acidity TEXT,
  color_description TEXT,
  nose_aromas TEXT,
  palate_flavors TEXT,
  finish_description TEXT,
  
  -- Ratings
  internal_rating NUMERIC(2,1),
  critic_scores JSONB,
  wine_advocate_score INTEGER CHECK (wine_advocate_score IS NULL OR (wine_advocate_score >= 50 AND wine_advocate_score <= 100)),
  wine_spectator_score INTEGER,
  james_suckling_score INTEGER,
  jancis_robinson_score NUMERIC(3,1),
  decanter_score INTEGER,
  vivino_rating NUMERIC(2,1),
  
  -- Food Pairing
  food_pairing TEXT,
  food_pairing_tags JSONB,
  serving_temperature_min INTEGER,
  serving_temperature_max INTEGER,
  decanting_time_minutes INTEGER,
  
  -- Production
  production_method TEXT,
  fermentation_vessel TEXT,
  aging_vessel TEXT,
  oak_aging_months INTEGER,
  oak_type TEXT,
  oak_toast_level TEXT,
  malolactic_fermentation BOOLEAN,
  cases_produced INTEGER,
  winemaker_name TEXT,
  
  -- Certifications
  certifications JSONB,
  is_organic BOOLEAN DEFAULT false,
  is_biodynamic BOOLEAN DEFAULT false,
  is_natural BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  awards JSONB,
  
  -- Barcodes
  primary_barcode TEXT,
  barcode_type TEXT,
  alternative_barcodes JSONB,
  
  -- Marketing
  marketing_description TEXT,
  short_description TEXT,
  story TEXT,
  featured_wine BOOLEAN DEFAULT false,
  wine_list_position INTEGER,
  wine_list_category TEXT,
  
  -- Digital
  website_url TEXT,
  vivino_url TEXT,
  slug TEXT UNIQUE,
  search_keywords TEXT,
  
  -- Metadata
  tags JSONB,
  internal_notes TEXT,
  grape_varieties JSONB,
  
  -- Status Flags
  is_active BOOLEAN DEFAULT true,
  is_discontinued BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  replacement_wine_id UUID REFERENCES wines(id),
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_wines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW
  EXECUTE FUNCTION update_wines_updated_at();
```

---

### Migration 4: Wine-Related Tables

**File:** `004_create_wine_related.sql`

```sql
-- Wine Variants (different vintages/sizes of same wine)
CREATE TABLE wine_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  vintage INTEGER,
  volume_ml INTEGER,
  bottle_state bottle_state_enum DEFAULT 'unopened',
  variant_name TEXT,
  variant_sku TEXT,
  variant_barcode TEXT,
  current_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER,
  purchase_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  syrve_product_id TEXT, -- For POS integration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wine Barcodes (multiple barcodes per wine)
CREATE TABLE wine_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  barcode_type TEXT, -- UPC-A, EAN-13, EAN-8
  region TEXT,
  distributor TEXT,
  packaging TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on barcode
CREATE UNIQUE INDEX idx_wine_barcodes_unique 
  ON wine_barcodes(barcode) 
  WHERE is_active = true;

-- Wine Images
CREATE TABLE wine_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  image_url TEXT,
  image_path TEXT,
  storage_provider TEXT DEFAULT 'supabase',
  storage_key TEXT,
  filename TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  width_px INTEGER,
  height_px INTEGER,
  image_type TEXT, -- label, bottle, shelf
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER,
  source TEXT, -- manual_upload, inventory_capture, import
  captured_during_inventory BOOLEAN DEFAULT false,
  inventory_session_id UUID,
  ai_confidence_score NUMERIC(5,2),
  ai_recognition_successful BOOLEAN,
  ocr_text TEXT,
  is_approved BOOLEAN DEFAULT true,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Migration 5: Inventory Tables

**File:** `005_create_inventory.sql`

```sql
-- Inventory Sessions
CREATE TABLE inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  session_type TEXT DEFAULT 'full', -- full, partial, spot_check
  description TEXT,
  status session_status_enum DEFAULT 'draft',
  location_filter UUID REFERENCES locations(id),
  wine_filter JSONB,
  total_wines_expected INTEGER DEFAULT 0,
  total_wines_counted INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  started_by UUID,
  completed_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Items (individual counts within session)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES wines(id),
  variant_id UUID REFERENCES wine_variants(id),
  expected_quantity_unopened INTEGER DEFAULT 0,
  expected_quantity_opened INTEGER DEFAULT 0,
  counted_quantity_unopened INTEGER,
  counted_quantity_opened INTEGER,
  variance_unopened INTEGER GENERATED ALWAYS AS (
    COALESCE(counted_quantity_unopened, 0) - expected_quantity_unopened
  ) STORED,
  variance_opened INTEGER GENERATED ALWAYS AS (
    COALESCE(counted_quantity_opened, 0) - expected_quantity_opened
  ) STORED,
  variance_total INTEGER GENERATED ALWAYS AS (
    (COALESCE(counted_quantity_unopened, 0) - expected_quantity_unopened) +
    (COALESCE(counted_quantity_opened, 0) - expected_quantity_opened)
  ) STORED,
  count_status TEXT DEFAULT 'pending',
  has_variance BOOLEAN GENERATED ALWAYS AS (
    (COALESCE(counted_quantity_unopened, 0) != expected_quantity_unopened) OR
    (COALESCE(counted_quantity_opened, 0) != expected_quantity_opened)
  ) STORED,
  counted_at TIMESTAMPTZ,
  counted_by UUID,
  counting_method counting_method_enum DEFAULT 'manual',
  counting_duration_seconds INTEGER,
  confidence NUMERIC(5,2),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Movements (stock change history)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES inventory_sessions(id),
  wine_id UUID NOT NULL REFERENCES wines(id),
  variant_id UUID REFERENCES wine_variants(id),
  movement_type movement_type_enum NOT NULL,
  bottle_state bottle_state_enum DEFAULT 'unopened',
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  unit_cost NUMERIC(10,2),
  total_value NUMERIC(12,2),
  reason TEXT,
  reference_number TEXT,
  location TEXT,
  recording_method TEXT,
  captured_image_id UUID REFERENCES wine_images(id),
  barcode_scanned TEXT,
  ai_confidence_score NUMERIC(5,2),
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Snapshots (point-in-time records)
CREATE TABLE stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  snapshot_time TIME NOT NULL DEFAULT CURRENT_TIME,
  wine_id UUID NOT NULL REFERENCES wines(id),
  stock_unopened INTEGER NOT NULL,
  stock_opened INTEGER NOT NULL,
  total_stock INTEGER GENERATED ALWAYS AS (stock_unopened + stock_opened) STORED,
  unit_cost NUMERIC(10,2),
  total_value NUMERIC(12,2) GENERATED ALWAYS AS (
    (stock_unopened + stock_opened) * COALESCE(unit_cost, 0)
  ) STORED,
  snapshot_type TEXT, -- session_start, session_end, daily, manual
  triggered_by UUID,
  session_id UUID REFERENCES inventory_sessions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Migration 6: User Management

**File:** `006_create_users.sql`

```sql
-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  avatar_color TEXT,
  employee_id TEXT,
  department TEXT,
  job_title TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  failed_login_attempts INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- User Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Role Configurations
CREATE TABLE app_roles_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  color TEXT,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_builtin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Role check function
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### Migration 7: Audit Tables

**File:** `007_create_audit.sql`

```sql
-- Comprehensive Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  description TEXT,
  reason TEXT,
  ip_address TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  performed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Error Logs
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System Notifications
CREATE TABLE system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App Settings
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);
```

---

### Migration 8: Indexes

**File:** `008_create_indexes.sql`

```sql
-- Wines indexes
CREATE INDEX idx_wines_active ON wines(is_active) WHERE is_active = true;
CREATE INDEX idx_wines_type_region ON wines(wine_type, region);
CREATE INDEX idx_wines_stock_status ON wines(stock_status);
CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_wines_country ON wines(country);
CREATE INDEX idx_wines_barcode ON wines(primary_barcode) WHERE primary_barcode IS NOT NULL;

-- JSONB GIN indexes
CREATE INDEX idx_wines_grape_varieties ON wines USING GIN(grape_varieties);
CREATE INDEX idx_wines_tags ON wines USING GIN(tags);
CREATE INDEX idx_wines_critic_scores ON wines USING GIN(critic_scores);

-- Inventory indexes
CREATE INDEX idx_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_sessions_started_by ON inventory_sessions(started_by);
CREATE INDEX idx_items_session ON inventory_items(session_id);
CREATE INDEX idx_items_wine ON inventory_items(wine_id);
CREATE INDEX idx_movements_wine ON inventory_movements(wine_id);
CREATE INDEX idx_movements_date ON inventory_movements(performed_at DESC);

-- User indexes
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- Audit indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(performed_at DESC);
```

---

## Verification Checklist

After running all migrations:

- [ ] All enums created (`SELECT * FROM pg_type WHERE typtype = 'e';`)
- [ ] All tables exist (`\dt` in psql)
- [ ] Foreign key constraints active
- [ ] Indexes created (`\di`)
- [ ] Profile trigger works (test user signup)
- [ ] `has_role()` function works

---

## Rollback Scripts

Keep rollback scripts ready for each migration:

```sql
-- Rollback example
DROP TABLE IF EXISTS wines CASCADE;
DROP TYPE IF EXISTS wine_type_enum CASCADE;
```

---

## Next Phase

→ [Phase 2: Supabase Client Setup](./phase-02-supabase-client.md)
