
-- Add is_marked (internal flag) and is_by_glass columns to products
ALTER TABLE public.products 
  ADD COLUMN is_marked boolean NOT NULL DEFAULT false,
  ADD COLUMN is_by_glass boolean NOT NULL DEFAULT false;
