
-- ============================================================
-- MIGRATION 2: Wines Table (full schema ~80 columns)
-- ============================================================

CREATE TABLE public.wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  full_name TEXT,
  producer TEXT,
  estate TEXT,
  producer_slug TEXT,

  -- Classification
  wine_type public.wine_type_enum,

  -- Vintage & aging
  vintage INT,
  is_non_vintage BOOLEAN NOT NULL DEFAULT false,
  bottling_date DATE,
  release_date DATE,
  optimal_drinking_start INT,
  optimal_drinking_end INT,
  aging_potential_years INT,

  -- Geography
  country TEXT,
  country_code TEXT,
  region TEXT,
  sub_region TEXT,
  appellation TEXT,
  vineyard TEXT,
  terroir TEXT,

  -- Product details
  volume_ml INT DEFAULT 750,
  volume_label TEXT DEFAULT '750ml',
  bottle_size TEXT DEFAULT 'standard',
  alcohol_content NUMERIC(4,1),
  residual_sugar NUMERIC(6,2),
  total_acidity NUMERIC(5,2),
  ph_level NUMERIC(3,2),

  -- Closure & packaging
  closure_type TEXT,
  bottle_color TEXT,
  capsule_type TEXT,
  label_design TEXT,

  -- Pricing
  purchase_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  retail_price NUMERIC(10,2),
  currency TEXT DEFAULT 'AED',
  price_tier TEXT,
  glass_price NUMERIC(10,2),
  glass_pour_size_ml INT,
  available_by_glass BOOLEAN NOT NULL DEFAULT false,

  -- Stock management
  current_stock_unopened INT NOT NULL DEFAULT 0,
  current_stock_opened INT NOT NULL DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  max_stock_level INT,
  reorder_point INT,
  reorder_quantity INT,
  stock_status TEXT DEFAULT 'in_stock',

  -- Internal
  sku TEXT UNIQUE,
  internal_code TEXT,
  bin_location TEXT,
  cellar_section TEXT,
  rack_number TEXT,
  shelf_position TEXT,

  -- Supplier info
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_sku TEXT,
  supplier_name TEXT,
  last_purchase_date DATE,
  last_purchase_quantity INT,
  last_purchase_price NUMERIC(10,2),

  -- Tasting & characteristics
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
  internal_rating NUMERIC(3,1),
  critic_scores JSONB DEFAULT '[]'::jsonb,
  wine_advocate_score INT,
  wine_spectator_score INT,
  decanter_score INT,
  jancis_robinson_score NUMERIC(3,1),
  james_suckling_score INT,
  vivino_rating NUMERIC(3,1),

  -- Food pairing
  food_pairing TEXT,
  food_pairing_tags JSONB DEFAULT '[]'::jsonb,
  serving_temperature_min NUMERIC(4,1),
  serving_temperature_max NUMERIC(4,1),
  decanting_time_minutes INT,

  -- Production
  production_method TEXT,
  fermentation_vessel TEXT,
  aging_vessel TEXT,
  oak_aging_months INT,
  oak_type TEXT,
  oak_toast_level TEXT,
  malolactic_fermentation BOOLEAN,
  cases_produced INT,

  -- Grape varieties (JSONB array)
  grape_varieties JSONB DEFAULT '[]'::jsonb,

  -- Certifications
  certifications JSONB DEFAULT '[]'::jsonb,
  is_organic BOOLEAN NOT NULL DEFAULT false,
  is_biodynamic BOOLEAN NOT NULL DEFAULT false,
  is_natural BOOLEAN NOT NULL DEFAULT false,
  is_vegan BOOLEAN NOT NULL DEFAULT false,
  awards JSONB DEFAULT '[]'::jsonb,

  -- Barcodes
  primary_barcode TEXT,
  barcode_type TEXT,
  alternative_barcodes JSONB DEFAULT '[]'::jsonb,

  -- Marketing
  marketing_description TEXT,
  short_description TEXT,
  story TEXT,
  winemaker_name TEXT,
  featured_wine BOOLEAN NOT NULL DEFAULT false,
  wine_list_position INT,
  wine_list_category TEXT,

  -- Digital
  website_url TEXT,
  vivino_url TEXT,

  -- Metadata
  tags JSONB DEFAULT '[]'::jsonb,
  internal_notes TEXT,
  slug TEXT UNIQUE,
  search_keywords TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_discontinued BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  replacement_wine_id UUID REFERENCES public.wines(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.wines ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated can read active wines
CREATE POLICY "Auth can read wines" ON public.wines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert wines" ON public.wines FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wines" ON public.wines FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete wines" ON public.wines FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_wines_updated_at BEFORE UPDATE ON public.wines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_wines_wine_type ON public.wines (wine_type);
CREATE INDEX idx_wines_region ON public.wines (country, region);
CREATE INDEX idx_wines_stock_status ON public.wines (stock_status);
CREATE INDEX idx_wines_is_active ON public.wines (is_active);
CREATE INDEX idx_wines_supplier ON public.wines (supplier_id);
CREATE INDEX idx_wines_sku ON public.wines (sku);
CREATE INDEX idx_wines_primary_barcode ON public.wines (primary_barcode);
CREATE INDEX idx_wines_tags ON public.wines USING GIN (tags);
CREATE INDEX idx_wines_grape_varieties ON public.wines USING GIN (grape_varieties);

-- Stock status trigger
CREATE OR REPLACE FUNCTION public.fn_update_stock_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.current_stock_unopened + NEW.current_stock_opened) = 0 THEN
    NEW.stock_status = 'out_of_stock';
  ELSIF NEW.min_stock_level IS NOT NULL AND (NEW.current_stock_unopened + NEW.current_stock_opened) <= NEW.min_stock_level THEN
    NEW.stock_status = 'low_stock';
  ELSE
    NEW.stock_status = 'in_stock';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER update_wine_stock_status
  BEFORE INSERT OR UPDATE OF current_stock_unopened, current_stock_opened, min_stock_level ON public.wines
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_stock_status();
