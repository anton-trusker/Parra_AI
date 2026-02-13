-- Inventory sessions
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type    TEXT NOT NULL,                      -- full, partial, spot_check
  status          TEXT NOT NULL DEFAULT 'draft',      -- draft, in_progress, completed, approved, sent_to_syrve, cancelled
  started_by      UUID NOT NULL REFERENCES profiles(id),
  location_id     UUID REFERENCES locations(id),
  category_ids    UUID[],                             -- For partial counts
  notes           TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  approved_by     UUID REFERENCES profiles(id),
  approved_at     TIMESTAMPTZ,
  sent_to_syrve_at TIMESTAMPTZ,
  syrve_document_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items (individual counts within a session)
CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  location_id     UUID REFERENCES locations(id),
  quantity        NUMERIC NOT NULL DEFAULT 0,
  quantity_opened NUMERIC DEFAULT 0,                  -- Partial bottles
  unit            TEXT,
  input_method    TEXT DEFAULT 'manual',              -- manual, barcode, ai
  counted_by      UUID NOT NULL REFERENCES profiles(id),
  counted_at      TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT,
  UNIQUE(session_id, product_id, location_id)
);

-- Session participants (collaborative counting)
CREATE TABLE IF NOT EXISTS session_participants (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ,
  items_counted   INTEGER DEFAULT 0,
  UNIQUE(session_id, user_id)
);

-- Inventory movements (audit trail)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  session_id      UUID REFERENCES inventory_sessions(id),
  movement_type   TEXT NOT NULL,                      -- count, adjustment, syrve_sync, receiving
  quantity_before NUMERIC,
  quantity_after  NUMERIC,
  quantity_delta  NUMERIC NOT NULL,
  performed_by    UUID REFERENCES profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Current stock (materialized view updated by triggers)
CREATE TABLE IF NOT EXISTS current_stock (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  location_id     UUID REFERENCES locations(id),
  quantity        NUMERIC NOT NULL DEFAULT 0,
  quantity_opened NUMERIC DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Update barcode_miss_logs to add session_id FK
ALTER TABLE barcode_miss_logs
  ADD CONSTRAINT fk_barcode_miss_session 
  FOREIGN KEY (session_id) 
  REFERENCES inventory_sessions(id) 
  ON DELETE SET NULL;

-- RLS Policies
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;

-- Inventory Sessions: Users can view/create their own, Admins can view all
CREATE POLICY "Users can view their own sessions" ON inventory_sessions
  FOR SELECT USING (started_by = auth.uid());

CREATE POLICY "Users can create sessions" ON inventory_sessions
  FOR INSERT WITH CHECK (started_by = auth.uid());

CREATE POLICY "Admins can view all sessions" ON inventory_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin', 'manager')
    )
  );

-- Inventory Items: Participants can view/edit items in their sessions
CREATE POLICY "Session participants can view items" ON inventory_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = inventory_items.session_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can add items" ON inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = inventory_items.session_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their counted items" ON inventory_items
  FOR UPDATE USING (counted_by = auth.uid());

-- Session Participants: Auto-managed, readable by session members
CREATE POLICY "Session participants can view themselves" ON session_participants
  FOR SELECT USING (user_id = auth.uid());

-- Movements: Readable by authenticated, created by triggers/functions
CREATE POLICY "Authenticated users can view movements" ON inventory_movements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Current Stock: Readable by all authenticated
CREATE POLICY "Authenticated users can view current stock" ON current_stock
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger to update current_stock when session is approved
CREATE OR REPLACE FUNCTION update_stock_from_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when session moves to 'approved' status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update current_stock based on inventory_items for this session
    INSERT INTO current_stock (product_id, location_id, quantity, quantity_opened, last_counted_at, last_counted_by, updated_at)
    SELECT 
      ii.product_id,
      ii.location_id,
      ii.quantity,
      ii.quantity_opened,
      ii.counted_at,
      ii.counted_by,
      NOW()
    FROM inventory_items ii
    WHERE ii.session_id = NEW.id
    ON CONFLICT (product_id) DO UPDATE SET
      quantity = EXCLUDED.quantity,
      quantity_opened = EXCLUDED.quantity_opened,
      last_counted_at = EXCLUDED.last_counted_at,
      last_counted_by = EXCLUDED.last_counted_by,
      updated_at = EXCLUDED.updated_at;
    
    -- Create movement records
    INSERT INTO inventory_movements (product_id, session_id, movement_type, quantity_before, quantity_after, quantity_delta, performed_by)
    SELECT 
      ii.product_id,
      NEW.id,
      'count',
      COALESCE(cs.quantity, 0),
      ii.quantity,
      ii.quantity - COALESCE(cs.quantity, 0),
      NEW.approved_by
    FROM inventory_items ii
    LEFT JOIN current_stock cs ON cs.product_id = ii.product_id
    WHERE ii.session_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_stock_from_session
  AFTER UPDATE OF status ON inventory_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_from_session();
