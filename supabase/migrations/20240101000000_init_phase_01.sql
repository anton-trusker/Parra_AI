-- Migration 1: Core Enums
CREATE TYPE wine_type_enum AS ENUM (
  'red', 'white', 'rose', 'sparkling', 
  'fortified', 'dessert', 'orange'
);

CREATE TYPE session_status_enum AS ENUM (
  'draft', 'in_progress', 'pending_review', 
  'completed', 'cancelled', 'approved', 'flagged'
);

CREATE TYPE movement_type_enum AS ENUM (
  'count_adjustment', 'sale', 'purchase', 
  'transfer', 'write_off', 'correction', 'breakage'
);

CREATE TYPE counting_method_enum AS ENUM (
  'manual', 'barcode', 'image_ai'
);

CREATE TYPE bottle_state_enum AS ENUM (
  'unopened', 'opened'
);

CREATE TYPE app_role AS ENUM (
  'admin', 'staff'
);

-- Migration 2: Reference Tables
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

CREATE TABLE grape_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT CHECK (color IN ('red', 'white')),
  origin_country TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT, -- cellar, warehouse, bar, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sub_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE volume_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- "750ml", "1.5L Magnum"
  ml INTEGER NOT NULL,
  bottle_size TEXT, -- standard, magnum, jeroboam
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE glass_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- "Standard", "Tasting"
  volume_litres NUMERIC(4,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration 3: Wines Table
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

-- Migration 4: Wine-Related Tables
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

CREATE UNIQUE INDEX idx_wine_barcodes_unique 
  ON wine_barcodes(barcode) 
  WHERE is_active = true;

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

-- Migration 6: User Management
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

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

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

CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Migration 7: Audit Tables
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

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Migration 8: Indexes
CREATE INDEX idx_wines_active ON wines(is_active) WHERE is_active = true;
CREATE INDEX idx_wines_type_region ON wines(wine_type, region);
CREATE INDEX idx_wines_stock_status ON wines(stock_status);
CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_wines_country ON wines(country);
CREATE INDEX idx_wines_barcode ON wines(primary_barcode) WHERE primary_barcode IS NOT NULL;

CREATE INDEX idx_wines_grape_varieties ON wines USING GIN(grape_varieties);
CREATE INDEX idx_wines_tags ON wines USING GIN(tags);
CREATE INDEX idx_wines_critic_scores ON wines USING GIN(critic_scores);

-- Note: Inventory indexes moved to next migration where inventory tables are created
-- CREATE INDEX idx_sessions_status ON inventory_sessions(status);
-- ...

CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(performed_at DESC);
