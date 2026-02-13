
-- Event-sourced inventory model (per spec section 3.2)

-- 1) Immutable baseline snapshot per session
CREATE TABLE public.inventory_baseline_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.wines(id),
  variant_id UUID REFERENCES public.wine_variants(id),
  expected_qty NUMERIC NOT NULL DEFAULT 0,
  expected_liters NUMERIC DEFAULT 0,
  raw_stock_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_baseline_items_session ON public.inventory_baseline_items(session_id);
CREATE UNIQUE INDEX idx_baseline_items_session_product ON public.inventory_baseline_items(session_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.inventory_baseline_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read baseline_items"
  ON public.inventory_baseline_items FOR SELECT USING (true);
CREATE POLICY "Auth insert baseline_items"
  ON public.inventory_baseline_items FOR INSERT WITH CHECK (true);

-- 2) Append-only count events
CREATE TABLE public.inventory_count_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.wines(id),
  variant_id UUID REFERENCES public.wine_variants(id),
  user_id UUID NOT NULL,
  bottle_qty NUMERIC NOT NULL DEFAULT 0,
  open_ml NUMERIC DEFAULT 0,
  derived_liters NUMERIC DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual_search',
  confidence NUMERIC,
  photo_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_count_events_session ON public.inventory_count_events(session_id);
CREATE INDEX idx_count_events_session_product ON public.inventory_count_events(session_id, product_id);
CREATE INDEX idx_count_events_user ON public.inventory_count_events(user_id);

ALTER TABLE public.inventory_count_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read count_events"
  ON public.inventory_count_events FOR SELECT USING (true);
CREATE POLICY "Auth insert count_events"
  ON public.inventory_count_events FOR INSERT WITH CHECK (true);

-- 3) Cached product aggregates (maintained by trigger)
CREATE TABLE public.inventory_product_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.wines(id),
  variant_id UUID REFERENCES public.wine_variants(id),
  counted_qty_total NUMERIC NOT NULL DEFAULT 0,
  counted_liters_total NUMERIC NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_product_agg_session_product ON public.inventory_product_aggregates(session_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_product_agg_session ON public.inventory_product_aggregates(session_id);

ALTER TABLE public.inventory_product_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read product_aggregates"
  ON public.inventory_product_aggregates FOR SELECT USING (true);
CREATE POLICY "Auth insert product_aggregates"
  ON public.inventory_product_aggregates FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update product_aggregates"
  ON public.inventory_product_aggregates FOR UPDATE USING (true);

-- 4) Trigger to auto-maintain aggregates on event insert
CREATE OR REPLACE FUNCTION public.update_inventory_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inventory_product_aggregates (
    session_id, product_id, variant_id,
    counted_qty_total, counted_liters_total, event_count, last_updated_at
  ) VALUES (
    NEW.session_id, NEW.product_id, NEW.variant_id,
    NEW.bottle_qty, NEW.derived_liters, 1, now()
  )
  ON CONFLICT (session_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET
    counted_qty_total = inventory_product_aggregates.counted_qty_total + EXCLUDED.counted_qty_total,
    counted_liters_total = inventory_product_aggregates.counted_liters_total + EXCLUDED.counted_liters_total,
    event_count = inventory_product_aggregates.event_count + 1,
    last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_count_event_aggregate
  AFTER INSERT ON public.inventory_count_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_aggregates();
