# 05 — Organization & Warehouses

## Overview

Syrve stores map to warehouses. The hierarchy is:
```
Corporation → Department → Store → Warehouse → Storage Area
```

## Tables

### org_nodes (Department Hierarchy)

```sql
CREATE TABLE org_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  syrve_id UUID NOT NULL,
  node_type org_node_type NOT NULL,
  parent_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  syrve_data JSONB,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, syrve_id)
);

CREATE INDEX idx_org_nodes_parent ON org_nodes(tenant_id, parent_id);
CREATE INDEX idx_org_nodes_active ON org_nodes(tenant_id, is_active);
```

### stores

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  syrve_store_id UUID NOT NULL,
  org_node_id UUID REFERENCES org_nodes(id),
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, syrve_store_id)
);

CREATE INDEX idx_stores_active ON stores(tenant_id, is_active);
```

### warehouses

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  syrve_store_id UUID NOT NULL,
  syrve_code TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  org_node_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  warehouse_type warehouse_type DEFAULT 'MAIN',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  coordinates JSONB,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  allow_negative_stock BOOLEAN DEFAULT false,
  require_approval_for_adjustments BOOLEAN DEFAULT true,
  syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, syrve_store_id)
);

CREATE INDEX idx_warehouses_store ON warehouses(tenant_id, store_id);
CREATE INDEX idx_warehouses_active ON warehouses(tenant_id, is_active) WHERE is_deleted = false;
CREATE INDEX idx_warehouses_type ON warehouses(tenant_id, warehouse_type);
```

### storage_areas

```sql
CREATE TABLE storage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  parent_area_id UUID REFERENCES storage_areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  area_type storage_area_type DEFAULT 'OTHER',
  description TEXT,
  capacity_sqm NUMERIC(10,2),
  temperature_min NUMERIC(5,2),
  temperature_max NUMERIC(5,2),
  humidity_min NUMERIC(5,2),
  humidity_max NUMERIC(5,2),
  sort_order INTEGER DEFAULT 0,
  color_hex TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse_id, code)
);

CREATE INDEX idx_storage_areas_warehouse ON storage_areas(tenant_id, warehouse_id);
CREATE INDEX idx_storage_areas_parent ON storage_areas(tenant_id, parent_area_id);
CREATE INDEX idx_storage_areas_type ON storage_areas(tenant_id, area_type);
```

## Import from Syrve

```
API: GET /corporation/departments → org_nodes
API: GET /corporation/stores → stores + warehouses
API: GET /corporation/groups → store_groups (optional)
```

Warehouse types mapped from Syrve store types:
- `DEFAULT` → `MAIN`
- `EXTERNAL` → `EXTERNAL`
- `PRODUCTION` → `PRODUCTION`
