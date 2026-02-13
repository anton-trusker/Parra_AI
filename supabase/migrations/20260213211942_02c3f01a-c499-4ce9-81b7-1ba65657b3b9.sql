
-- Add enrichment linking columns to wines table
ALTER TABLE public.wines
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS syrve_product_id text,
  ADD COLUMN IF NOT EXISTS enrichment_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS raw_source_name text;

-- Unique index: one product maps to at most one wine
CREATE UNIQUE INDEX IF NOT EXISTS idx_wines_product_id
  ON public.wines(product_id) WHERE product_id IS NOT NULL;

-- Index for fast Syrve ID lookups
CREATE INDEX IF NOT EXISTS idx_wines_syrve_product_id
  ON public.wines(syrve_product_id) WHERE syrve_product_id IS NOT NULL;
