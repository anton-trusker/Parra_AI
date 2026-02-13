
-- Fix categories RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Auth read categories" ON public.categories;

CREATE POLICY "Auth read categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix products RLS
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Auth read products" ON public.products;

CREATE POLICY "Auth read products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix product_barcodes RLS
DROP POLICY IF EXISTS "Admins manage product_barcodes" ON public.product_barcodes;
DROP POLICY IF EXISTS "Auth read product_barcodes" ON public.product_barcodes;

CREATE POLICY "Auth read product_barcodes"
  ON public.product_barcodes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage product_barcodes"
  ON public.product_barcodes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
