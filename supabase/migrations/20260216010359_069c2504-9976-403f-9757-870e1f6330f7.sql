
-- Create stock_levels table for per-warehouse stock tracking
CREATE TABLE public.stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  quantity NUMERIC(20,6) NOT NULL DEFAULT 0,
  unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,
  unit_cost NUMERIC(15,4),
  source TEXT DEFAULT 'syrve',
  sync_run_id UUID REFERENCES syrve_sync_runs(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- Indexes
CREATE INDEX idx_stock_levels_store ON stock_levels(store_id);
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_positive ON stock_levels(store_id) WHERE quantity > 0;

-- Enable RLS
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read stock_levels" ON public.stock_levels FOR SELECT USING (true);
CREATE POLICY "Admins manage stock_levels" ON public.stock_levels FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_stock_levels_updated_at
  BEFORE UPDATE ON public.stock_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
