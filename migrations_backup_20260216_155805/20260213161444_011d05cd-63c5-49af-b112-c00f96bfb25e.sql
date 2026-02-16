
-- Add import configuration columns to syrve_config
ALTER TABLE public.syrve_config
  ADD COLUMN IF NOT EXISTS product_type_filters text[] DEFAULT ARRAY['GOODS','DISH'],
  ADD COLUMN IF NOT EXISTS field_mapping jsonb DEFAULT '{
    "extract_vintage": true,
    "extract_volume": true,
    "auto_map_category": true,
    "name_field": "name",
    "sku_field": "num",
    "description_field": "description"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_create_wines boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_direction text DEFAULT 'syrve_to_local',
  ADD COLUMN IF NOT EXISTS import_inactive_products boolean DEFAULT false;
