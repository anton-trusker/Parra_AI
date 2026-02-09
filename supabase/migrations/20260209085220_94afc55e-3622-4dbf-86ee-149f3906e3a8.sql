
-- ============================================================
-- MIGRATION 3: Wine Related Tables + Migration 4: Inventory Tables
-- ============================================================

-- Wine variants
CREATE TABLE public.wine_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_wine_id UUID NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  vintage INT,
  volume_ml INT DEFAULT 750,
  bottle_state public.bottle_state_enum DEFAULT 'unopened',
  variant_name TEXT,
  variant_sku TEXT,
  variant_barcode TEXT,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  purchase_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  syrve_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wine barcodes
CREATE TABLE public.wine_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  barcode_type TEXT,
  region TEXT,
  distributor TEXT,
  packaging TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wine images
CREATE TABLE public.wine_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  image_url TEXT,
  image_path TEXT,
  storage_provider TEXT DEFAULT 'supabase',
  storage_key TEXT,
  filename TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INT,
  width_px INT,
  height_px INT,
  image_type TEXT DEFAULT 'bottle',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INT DEFAULT 0,
  source TEXT,
  captured_during_inventory BOOLEAN NOT NULL DEFAULT false,
  inventory_session_id UUID,
  ai_confidence_score NUMERIC(5,4),
  ai_recognition_successful BOOLEAN,
  ocr_text TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Inventory Sessions
-- ============================================================
CREATE TABLE public.inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  session_type TEXT DEFAULT 'full',
  description TEXT,
  status public.session_status_enum NOT NULL DEFAULT 'draft',
  location_filter TEXT,
  wine_filter JSONB DEFAULT '{}'::jsonb,
  total_wines_expected INT NOT NULL DEFAULT 0,
  total_wines_counted INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INT,
  started_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory Items
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES public.wines(id),
  variant_id UUID REFERENCES public.wine_variants(id),
  expected_quantity_unopened INT NOT NULL DEFAULT 0,
  expected_quantity_opened INT NOT NULL DEFAULT 0,
  counted_quantity_unopened INT,
  counted_quantity_opened INT,
  variance_unopened INT GENERATED ALWAYS AS (COALESCE(counted_quantity_unopened, 0) - expected_quantity_unopened) STORED,
  variance_opened INT GENERATED ALWAYS AS (COALESCE(counted_quantity_opened, 0) - expected_quantity_opened) STORED,
  variance_total INT GENERATED ALWAYS AS (
    (COALESCE(counted_quantity_unopened, 0) - expected_quantity_unopened) +
    (COALESCE(counted_quantity_opened, 0) - expected_quantity_opened)
  ) STORED,
  count_status TEXT DEFAULT 'pending',
  has_variance BOOLEAN GENERATED ALWAYS AS (
    (COALESCE(counted_quantity_unopened, 0) - expected_quantity_unopened) != 0 OR
    (COALESCE(counted_quantity_opened, 0) - expected_quantity_opened) != 0
  ) STORED,
  counted_at TIMESTAMPTZ,
  counted_by UUID REFERENCES auth.users(id),
  counting_method public.counting_method_enum,
  counting_duration_seconds INT,
  confidence NUMERIC(5,4),
  location TEXT,
  notes TEXT
);

-- Inventory Movements
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.inventory_sessions(id),
  wine_id UUID NOT NULL REFERENCES public.wines(id),
  variant_id UUID REFERENCES public.wine_variants(id),
  movement_type public.movement_type_enum NOT NULL,
  bottle_state public.bottle_state_enum,
  quantity_before INT NOT NULL DEFAULT 0,
  quantity_change INT NOT NULL,
  quantity_after INT NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2),
  total_value NUMERIC(10,2),
  reason TEXT,
  reference_number TEXT,
  location TEXT,
  recording_method TEXT,
  captured_image_id UUID REFERENCES public.wine_images(id),
  barcode_scanned TEXT,
  ai_confidence_score NUMERIC(5,4),
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Snapshots
CREATE TABLE public.stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  snapshot_time TIME NOT NULL DEFAULT CURRENT_TIME,
  wine_id UUID NOT NULL REFERENCES public.wines(id),
  stock_unopened INT NOT NULL DEFAULT 0,
  stock_opened INT NOT NULL DEFAULT 0,
  total_stock INT GENERATED ALWAYS AS (stock_unopened + stock_opened) STORED,
  unit_cost NUMERIC(10,2),
  total_value NUMERIC(10,2) GENERATED ALWAYS AS ((stock_unopened + stock_opened) * COALESCE(unit_cost, 0)) STORED,
  snapshot_type TEXT DEFAULT 'manual',
  triggered_by TEXT,
  session_id UUID REFERENCES public.inventory_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS for all tables
-- ============================================================
ALTER TABLE public.wine_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_snapshots ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated)
CREATE POLICY "Auth read wine_variants" ON public.wine_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read wine_barcodes" ON public.wine_barcodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read wine_images" ON public.wine_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read sessions" ON public.inventory_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read movements" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read snapshots" ON public.stock_snapshots FOR SELECT TO authenticated USING (true);

-- Write policies
CREATE POLICY "Auth insert sessions" ON public.inventory_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sessions" ON public.inventory_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert items" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update items" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert snapshots" ON public.stock_snapshots FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins manage variants" ON public.wine_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage barcodes" ON public.wine_barcodes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth insert images" ON public.wine_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage images" ON public.wine_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete images" ON public.wine_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FK index on wine_images for inventory_session_id
ALTER TABLE public.wine_images ADD CONSTRAINT fk_wine_images_session FOREIGN KEY (inventory_session_id) REFERENCES public.inventory_sessions(id);

-- Indexes
CREATE INDEX idx_wine_variants_base ON public.wine_variants (base_wine_id);
CREATE INDEX idx_wine_barcodes_wine ON public.wine_barcodes (wine_id);
CREATE INDEX idx_wine_barcodes_barcode ON public.wine_barcodes (barcode);
CREATE INDEX idx_wine_images_wine ON public.wine_images (wine_id);
CREATE INDEX idx_sessions_status ON public.inventory_sessions (status);
CREATE INDEX idx_items_session ON public.inventory_items (session_id);
CREATE INDEX idx_items_wine ON public.inventory_items (wine_id);
CREATE INDEX idx_movements_session ON public.inventory_movements (session_id);
CREATE INDEX idx_movements_wine ON public.inventory_movements (wine_id);
CREATE INDEX idx_movements_type ON public.inventory_movements (movement_type);
CREATE INDEX idx_snapshots_wine ON public.stock_snapshots (wine_id);
CREATE INDEX idx_snapshots_date ON public.stock_snapshots (snapshot_date);

-- Triggers
CREATE TRIGGER update_wine_variants_updated_at BEFORE UPDATE ON public.wine_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.inventory_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
