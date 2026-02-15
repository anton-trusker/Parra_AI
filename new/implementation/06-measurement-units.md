# 06 — Measurement Units

## Why This Matters

You MUST import ALL measurement units from Syrve to:
1. Know what units products are tracked in
2. Convert counted units (bottles) to Syrve units (liters)
3. Support all business types (not just beverages)
4. Handle custom units defined by the business

## Table

```sql
CREATE TABLE measurement_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Syrve identifiers
  syrve_unit_id UUID NOT NULL,
  syrve_code TEXT,

  -- Details
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  plural_name TEXT,
  unit_type unit_type NOT NULL,

  -- Conversion to base unit
  base_unit_id UUID REFERENCES measurement_units(id),
  conversion_factor NUMERIC(20,10),
  conversion_offset NUMERIC(20,10) DEFAULT 0,

  -- Display
  decimal_places INTEGER DEFAULT 2,
  display_format TEXT,

  -- Usage flags
  is_active BOOLEAN DEFAULT true,
  is_system_unit BOOLEAN DEFAULT false,
  can_be_fractional BOOLEAN DEFAULT true,
  use_in_inventory BOOLEAN DEFAULT true,
  use_in_counting BOOLEAN DEFAULT true,

  -- Syrve data
  syrve_data JSONB,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, syrve_unit_id),
  UNIQUE(tenant_id, short_name)
);

CREATE INDEX idx_units_type ON measurement_units(tenant_id, unit_type);
CREATE INDEX idx_units_active ON measurement_units(tenant_id, is_active);
CREATE INDEX idx_units_inventory ON measurement_units(tenant_id, use_in_inventory)
  WHERE use_in_inventory = true;
```

## Conversion Functions

```sql
CREATE OR REPLACE FUNCTION convert_quantity(
  p_quantity NUMERIC,
  p_from_unit_id UUID,
  p_to_unit_id UUID,
  p_tenant_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_from_factor NUMERIC;
  v_to_factor NUMERIC;
  v_from_offset NUMERIC;
  v_to_offset NUMERIC;
  v_base_quantity NUMERIC;
BEGIN
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN p_quantity;
  END IF;

  SELECT
    COALESCE(from_unit.conversion_factor, 1),
    COALESCE(from_unit.conversion_offset, 0),
    COALESCE(to_unit.conversion_factor, 1),
    COALESCE(to_unit.conversion_offset, 0)
  INTO v_from_factor, v_from_offset, v_to_factor, v_to_offset
  FROM measurement_units from_unit
  CROSS JOIN measurement_units to_unit
  WHERE from_unit.id = p_from_unit_id
    AND to_unit.id = p_to_unit_id
    AND from_unit.tenant_id = p_tenant_id
    AND to_unit.tenant_id = p_tenant_id;

  IF v_from_factor IS NULL THEN
    RAISE EXCEPTION 'Cannot convert: unit not found or incompatible';
  END IF;

  v_base_quantity := (p_quantity * v_from_factor) + v_from_offset;
  RETURN (v_base_quantity - v_to_offset) / v_to_factor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_unit_id_by_name(
  p_tenant_id UUID,
  p_short_name TEXT
)
RETURNS UUID AS $$
  SELECT id FROM measurement_units
  WHERE tenant_id = p_tenant_id
    AND (short_name = p_short_name OR name = p_short_name)
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
```

## Common Units (examples)

| Unit | Type | Base | Factor |
|------|------|------|--------|
| Liter (L) | VOLUME | BASE | — |
| Milliliter (ml) | VOLUME | L | 0.001 |
| Centiliter (cl) | VOLUME | L | 0.01 |
| Hectoliter (hL) | VOLUME | L | 100 |
| Kilogram (kg) | WEIGHT | BASE | — |
| Gram (g) | WEIGHT | kg | 0.001 |
| Piece (pc) | COUNT | BASE | 1 |
| Bottle (btl) | COUNT | — | maps to volume via product capacity |
| Case | COUNT | — | contains N pieces |

## Import from Syrve

```
API: GET /resto/api/units/list?key={token}
Fallback: Extract from product mainUnit fields
```

## Inventory Count → Syrve Conversion

```
Staff counts: 15 bottles
Product capacity: 0.75 L/bottle
Syrve main unit: Liters

Conversion: 15 × 0.75 = 11.25 L
Send to Syrve: 11.25 (in product's main unit)
```
