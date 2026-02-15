# 09 — Inventory Operations

## Complete Lifecycle

```
draft → in_progress → counting_complete → under_review → pending_approval → approved → sending → synced
                                                                                    ↘ failed
cancelled (from any state before synced)
```

## Phase 1: Session Creation (Admin/Manager)

1. Admin selects warehouse
2. System fetches stock from Syrve (baseline)
3. Filters: GOODS + positive stock + active
4. Creates `inventory_session` (status=draft)
5. Copies baseline to `inventory_baseline_items`
6. Changes status to `in_progress`

## Phase 2: Counting (Staff)

- Staff scans barcode OR searches product
- Enters count in natural units (15 bottles, 2 kegs)
- System stores as `inventory_count_events` (append-only)
- Multiple staff can count same product without conflicts
- Real-time aggregation in `inventory_product_aggregates`

## Phase 3: Review (Manager)

- Manager sees expected vs counted vs variance
- Can add `inventory_review_notes` per product
- Can make `inventory_product_adjustments`
- Changes status through review states

## Phase 4: Conversion & Send to Syrve

1. Convert counts: 15 bottles × 0.75L = 11.25L
2. Build XML incomingInventory document
3. Store in `syrve_outbox_jobs`
4. Background worker sends to Syrve
5. Store Syrve document ID on success

## Tables

### inventory_sessions

```sql
CREATE TABLE inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,

  title TEXT NOT NULL,
  description TEXT,
  status inventory_session_status DEFAULT 'draft',
  status_history JSONB DEFAULT '[]'::jsonb,

  baseline_source TEXT DEFAULT 'syrve_stock',
  baseline_taken_at TIMESTAMPTZ,
  manager_only_expected BOOLEAN DEFAULT true,

  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ,
  counting_completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  syrve_document_id TEXT,
  syrve_document_number TEXT,
  syrve_synced_at TIMESTAMPTZ,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,

  total_products_expected INTEGER DEFAULT 0,
  total_products_counted INTEGER DEFAULT 0,
  total_products_with_variance INTEGER DEFAULT 0,
  total_value_expected NUMERIC(15,2),
  total_value_counted NUMERIC(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_sessions_warehouse ON inventory_sessions(tenant_id, warehouse_id);
CREATE INDEX idx_inv_sessions_status ON inventory_sessions(tenant_id, status);
CREATE INDEX idx_inv_sessions_created ON inventory_sessions(tenant_id, created_at DESC);
```

### inventory_baseline_items

```sql
CREATE TABLE inventory_baseline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  expected_quantity NUMERIC(20,6) NOT NULL,
  expected_unit_id UUID NOT NULL REFERENCES measurement_units(id),
  expected_in_counting_unit NUMERIC(20,6),
  counting_unit_id UUID REFERENCES measurement_units(id),
  unit_cost NUMERIC(15,4),
  expected_value NUMERIC(15,2) GENERATED ALWAYS AS (expected_quantity * unit_cost) STORED,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_baseline_session ON inventory_baseline_items(tenant_id, session_id);
```

### inventory_count_events (Append-only)

```sql
CREATE TABLE inventory_count_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  counted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  quantity_counted NUMERIC(20,6) NOT NULL,
  counting_unit_id UUID NOT NULL REFERENCES measurement_units(id),
  container_id UUID REFERENCES product_containers(id),
  containers_counted INTEGER,
  quantity_in_product_unit NUMERIC(20,6),
  product_unit_id UUID REFERENCES measurement_units(id),

  method inventory_count_method DEFAULT 'manual',
  confidence NUMERIC(5,4),
  photo_asset_id UUID,
  storage_area_id UUID REFERENCES storage_areas(id),
  notes TEXT,
  counted_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB
);

CREATE INDEX idx_count_events_session ON inventory_count_events(tenant_id, session_id);
CREATE INDEX idx_count_events_product ON inventory_count_events(tenant_id, session_id, product_id);
CREATE INDEX idx_count_events_user ON inventory_count_events(tenant_id, counted_by);
```

### inventory_product_aggregates

```sql
CREATE TABLE inventory_product_aggregates (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  total_counted NUMERIC(20,6) NOT NULL DEFAULT 0,
  counting_unit_id UUID REFERENCES measurement_units(id),
  total_in_product_unit NUMERIC(20,6) NOT NULL DEFAULT 0,
  unique_counters INTEGER DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, product_id)
);
```

### inventory_review_notes

```sql
CREATE TABLE inventory_review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'review',
  requires_attention BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE INDEX idx_review_notes_session ON inventory_review_notes(tenant_id, session_id);
CREATE INDEX idx_review_notes_attention ON inventory_review_notes(tenant_id, session_id)
  WHERE requires_attention = true AND is_resolved = false;
```

### inventory_product_adjustments

```sql
CREATE TABLE inventory_product_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_quantity NUMERIC(20,6) NOT NULL,
  adjusted_quantity NUMERIC(20,6) NOT NULL,
  adjustment_delta NUMERIC(20,6) GENERATED ALWAYS AS (adjusted_quantity - original_quantity) STORED,
  unit_id UUID NOT NULL REFERENCES measurement_units(id),
  reason TEXT NOT NULL,
  reason_category TEXT, -- damaged|expired|theft|miscount|other
  adjusted_by UUID NOT NULL REFERENCES profiles(id),
  adjusted_at TIMESTAMPTZ DEFAULT NOW(),
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ
);
```

### inventory_variances

```sql
CREATE TABLE inventory_variances (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  expected_total NUMERIC(20,6) DEFAULT 0,
  counted_total NUMERIC(20,6) DEFAULT 0,
  difference NUMERIC(20,6) DEFAULT 0,
  has_variance BOOLEAN DEFAULT false,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, product_id)
);

CREATE INDEX idx_variances_flagged ON inventory_variances(tenant_id, session_id, has_variance)
  WHERE has_variance = true;
```
