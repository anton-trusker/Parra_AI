-- 1. Simplify measurement_units: drop unused columns
ALTER TABLE public.measurement_units DROP COLUMN IF EXISTS code;
ALTER TABLE public.measurement_units DROP COLUMN IF EXISTS syrve_data;
ALTER TABLE public.measurement_units DROP COLUMN IF EXISTS updated_at;

-- 2. Add parent_product_id to products for goods→dish linking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS parent_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Index for fast lookups of child products
CREATE INDEX IF NOT EXISTS idx_products_parent_product_id ON public.products(parent_product_id) WHERE parent_product_id IS NOT NULL;