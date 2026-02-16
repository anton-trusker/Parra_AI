
-- Create measurement_units table for Syrve unit import
CREATE TABLE public.measurement_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  syrve_unit_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  code TEXT,
  main_unit_syrve_id TEXT,
  main_unit_id UUID REFERENCES public.measurement_units(id),
  is_main BOOLEAN NOT NULL DEFAULT false,
  factor NUMERIC DEFAULT 1,
  syrve_data JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth read measurement_units" ON public.measurement_units
  FOR SELECT USING (true);

CREATE POLICY "Admins manage measurement_units" ON public.measurement_units
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for lookups
CREATE INDEX idx_measurement_units_syrve_id ON public.measurement_units(syrve_unit_id);
CREATE INDEX idx_measurement_units_main_unit ON public.measurement_units(main_unit_syrve_id);
