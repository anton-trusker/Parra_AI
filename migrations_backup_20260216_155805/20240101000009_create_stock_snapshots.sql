-- Stock Snapshots (point-in-time records)
CREATE TABLE stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  snapshot_time TIME NOT NULL DEFAULT CURRENT_TIME,
  wine_id UUID NOT NULL REFERENCES wines(id),
  stock_unopened INTEGER NOT NULL,
  stock_opened INTEGER NOT NULL,
  total_stock INTEGER GENERATED ALWAYS AS (stock_unopened + stock_opened) STORED,
  unit_cost NUMERIC(10,2),
  total_value NUMERIC(12,2) GENERATED ALWAYS AS (
    (stock_unopened + stock_opened) * COALESCE(unit_cost, 0)
  ) STORED,
  snapshot_type TEXT, -- session_start, session_end, daily, manual
  triggered_by UUID,
  session_id UUID REFERENCES inventory_sessions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
