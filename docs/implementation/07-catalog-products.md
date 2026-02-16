# 07 — Catalog & Products

## Tables

### categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  path TEXT, -- materialized path for fast hierarchy queries
  is_active BOOLEAN DEFAULT true,
  custom_fields JSONB DEFAULT '{}',
  syrve_group_id UUID,
  syrve_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, syrve_group_id)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id, is_active);
CREATE INDEX idx_categories_parent ON categories(tenant_id, parent_id);
CREATE INDEX idx_categories_path ON categories(tenant_id, path) WHERE path IS NOT NULL;
```

### products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Syrve identifiers
  syrve_product_id UUID NOT NULL,
  sku TEXT,
  code TEXT,

  -- Core
  name TEXT NOT NULL,
  description TEXT,
  product_type product_type DEFAULT 'GOODS',

  -- Measurement (CRITICAL)
  main_unit_id UUID REFERENCES measurement_units(id),
  unit_capacity NUMERIC(20,6),
  unit_weight NUMERIC(20,6),
  counting_unit_id UUID REFERENCES measurement_units(id),
  container_type TEXT,
  container_capacity NUMERIC(20,6),
  container_capacity_unit_id UUID REFERENCES measurement_units(id),

  -- Pricing
  cost_price NUMERIC(15,2),
  sale_price NUMERIC(15,2),
  default_sale_price NUMERIC(15,2),
  currency TEXT DEFAULT 'EUR',

  -- Inventory behavior
  track_inventory BOOLEAN DEFAULT true,
  current_stock NUMERIC(20,6) DEFAULT 0,
  not_in_store_movement BOOLEAN DEFAULT false,
  min_stock_level NUMERIC(20,6),
  max_stock_level NUMERIC(20,6),
  reorder_point NUMERIC(20,6),

  -- Images
  primary_image_url TEXT,
  images JSONB DEFAULT '[]',

  -- AI
  ai_recognized BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,

  -- Custom fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[],

  -- Full Syrve data
  syrve_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Search
  search_vector tsvector,

  UNIQUE(tenant_id, syrve_product_id)
);

CREATE INDEX idx_products_tenant ON products(tenant_id, is_active);
CREATE INDEX idx_products_category ON products(tenant_id, category_id);
CREATE INDEX idx_products_type ON products(tenant_id, product_type);
CREATE INDEX idx_products_goods ON products(tenant_id, product_type)
  WHERE product_type = 'GOODS' AND is_deleted = false;
CREATE INDEX idx_products_inventory ON products(tenant_id, is_active, track_inventory)
  WHERE track_inventory = true AND is_active = true AND not_in_store_movement = false;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
```

### product_barcodes

```sql
CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  source barcode_source DEFAULT 'syrve',
  confidence NUMERIC(3,2),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, barcode)
);

CREATE INDEX idx_barcodes_product ON product_barcodes(tenant_id, product_id);
CREATE INDEX idx_barcodes_barcode ON product_barcodes(tenant_id, barcode);
```

### product_containers

```sql
CREATE TABLE product_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  syrve_container_id UUID NOT NULL,
  syrve_code TEXT,
  name TEXT NOT NULL,
  container_type TEXT,
  capacity NUMERIC(20,6) NOT NULL,
  capacity_unit_id UUID NOT NULL REFERENCES measurement_units(id),
  units_per_container INTEGER DEFAULT 1,
  tare_weight NUMERIC(15,6),
  gross_weight NUMERIC(15,6),
  net_weight NUMERIC(15,6),
  container_barcode TEXT,
  is_default BOOLEAN DEFAULT false,
  use_in_inventory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  syrve_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, syrve_container_id)
);

CREATE INDEX idx_containers_product ON product_containers(tenant_id, product_id);
CREATE INDEX idx_containers_default ON product_containers(tenant_id, product_id, is_default)
  WHERE is_default = true;
```

### product_integration_mappings

```sql
CREATE TABLE product_integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES tenant_integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  external_data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_direction TEXT,
  UNIQUE(integration_id, external_id),
  UNIQUE(product_id, integration_id)
);
```

## Import from Syrve

```
API: GET /v2/entities/products/group/list → categories
API: GET /v2/entities/products/list → products + barcodes + containers
```

For inventory: filter `product_type = 'GOODS'`, `not_in_store_movement = false`, `is_active = true`.
