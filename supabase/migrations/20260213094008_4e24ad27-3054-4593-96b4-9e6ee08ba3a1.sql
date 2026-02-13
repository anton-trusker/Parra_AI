
-- Phase 3: Syrve Integration Tables
-- ===================================

-- 1. Syrve Configuration (singleton per installation)
CREATE TABLE public.syrve_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_url TEXT NOT NULL DEFAULT 'https://parra.syrve.online:443/resto/api',
  api_login TEXT NOT NULL DEFAULT '',
  api_password_hash TEXT, -- SHA1 hash of the password
  default_store_id TEXT, -- Selected Syrve store UUID
  default_store_name TEXT,
  sync_interval_minutes INTEGER DEFAULT 60,
  connection_status TEXT DEFAULT 'not_configured', -- not_configured, connected, failed
  connection_tested_at TIMESTAMPTZ,
  sync_lock_until TIMESTAMPTZ, -- Prevent parallel sync (license constraint)
  selected_category_ids TEXT[], -- Optional category filter
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.syrve_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage syrve_config" ON public.syrve_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read syrve_config" ON public.syrve_config
  FOR SELECT USING (true);

-- 2. Syrve Raw Objects (lossless mirror of all Syrve payloads)
CREATE TABLE public.syrve_raw_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- department, group, store, product, product_group
  syrve_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  payload_hash TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  UNIQUE(entity_type, syrve_id)
);

ALTER TABLE public.syrve_raw_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage syrve_raw_objects" ON public.syrve_raw_objects
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read syrve_raw_objects" ON public.syrve_raw_objects
  FOR SELECT USING (true);

-- 3. Syrve Sync Runs (run-level audit)
CREATE TABLE public.syrve_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL, -- bootstrap, products, categories, stores, stock_snapshot
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- running, success, failed, partial
  stats JSONB DEFAULT '{}', -- {inserted: N, updated: N, deleted: N}
  error TEXT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.syrve_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage syrve_sync_runs" ON public.syrve_sync_runs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read syrve_sync_runs" ON public.syrve_sync_runs
  FOR SELECT USING (true);

-- 4. Syrve API Logs (request/response audit)
CREATE TABLE public.syrve_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES public.syrve_sync_runs(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- AUTH, LOGOUT, FETCH_PRODUCTS, FETCH_STORES, etc.
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, error
  request_url TEXT,
  request_method TEXT DEFAULT 'GET',
  response_status INTEGER,
  response_payload_preview TEXT, -- Truncated for storage
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.syrve_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage syrve_api_logs" ON public.syrve_api_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Syrve Outbox Jobs (reliable delivery to Syrve)
CREATE TABLE public.syrve_outbox_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.inventory_sessions(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL, -- inventory_check, inventory_commit
  payload_xml TEXT,
  payload_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  response_xml TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_type, payload_hash)
);

ALTER TABLE public.syrve_outbox_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage syrve_outbox_jobs" ON public.syrve_outbox_jobs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read syrve_outbox_jobs" ON public.syrve_outbox_jobs
  FOR SELECT USING (true);

-- 6. Stores (Syrve warehouses)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syrve_store_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  code TEXT,
  store_type TEXT, -- store type from Syrve
  is_active BOOLEAN DEFAULT true,
  syrve_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stores" ON public.stores
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read stores" ON public.stores
  FOR SELECT USING (true);

-- 7. Categories (Syrve product groups, hierarchical)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syrve_group_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  parent_syrve_id TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  syrve_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read categories" ON public.categories
  FOR SELECT USING (true);

-- 8. Products (canonical Syrve products)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syrve_product_id TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT, -- num field from Syrve
  code TEXT, -- speed dial code
  product_type TEXT, -- GOODS, DISH, PREPARED, etc.
  main_unit_id TEXT,
  unit_capacity NUMERIC, -- liters
  default_sale_price NUMERIC,
  not_in_store_movement BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  syrve_data JSONB DEFAULT '{}', -- Full Syrve payload
  metadata JSONB DEFAULT '{}', -- App-specific enrichment
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read products" ON public.products
  FOR SELECT USING (true);

-- 9. Product Barcodes
CREATE TABLE public.product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  container_name TEXT,
  source TEXT DEFAULT 'syrve', -- syrve, manual, ai
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barcode)
);

ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage product_barcodes" ON public.product_barcodes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read product_barcodes" ON public.product_barcodes
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_syrve_raw_entity_type ON public.syrve_raw_objects(entity_type);
CREATE INDEX idx_syrve_sync_runs_status ON public.syrve_sync_runs(status);
CREATE INDEX idx_syrve_sync_runs_type ON public.syrve_sync_runs(run_type);
CREATE INDEX idx_syrve_api_logs_run ON public.syrve_api_logs(sync_run_id);
CREATE INDEX idx_syrve_outbox_status ON public.syrve_outbox_jobs(status);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_product_barcodes_product ON public.product_barcodes(product_id);
CREATE INDEX idx_product_barcodes_barcode ON public.product_barcodes(barcode);

-- Triggers for updated_at
CREATE TRIGGER update_syrve_config_updated_at BEFORE UPDATE ON public.syrve_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_syrve_outbox_updated_at BEFORE UPDATE ON public.syrve_outbox_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
