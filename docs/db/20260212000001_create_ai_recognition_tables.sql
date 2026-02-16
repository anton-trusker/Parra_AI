-- Phase 6: AI Recognition & Product Identification
-- Create tables for AI recognition attempts, configuration, and audit trail

-- AI recognition attempts (audit trail)
CREATE TABLE IF NOT EXISTS ai_recognition_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES global_inventory_session(id) ON DELETE SET NULL,
  image_url TEXT,
  image_base64 TEXT,  -- Temporary storage, deleted after processing
  model_used TEXT DEFAULT 'gemini-1.5-flash',
  prompt_version TEXT DEFAULT 'v1',
  raw_response JSONB,
  extracted_data JSONB,  -- Structured: {product_name, brand, confidence, category, etc}
  matched_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  match_confidence NUMERIC(5,2),  -- 0-100
  match_method TEXT,  -- exact, fuzzy, manual, none
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  status TEXT DEFAULT 'processing',  -- processing, success, failed, manual_review
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- AI configuration (API keys, model settings)
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'google',  -- google, openai, custom
  model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  api_key_encrypted TEXT,  -- Encrypted via Vault
  is_active BOOLEAN DEFAULT true,
  is_system_provided BOOLEAN DEFAULT false,  -- True for organization-provided keys
  rate_limit_per_minute INTEGER DEFAULT 60,
  max_image_size_mb INTEGER DEFAULT 4,
  supported_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp'],
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_attempts_user_session ON ai_recognition_attempts(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_attempts_matched_product ON ai_recognition_attempts(matched_product_id);
CREATE INDEX IF NOT EXISTS idx_ai_attempts_created_at ON ai_recognition_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_attempts_status ON ai_recognition_attempts(status);

-- RLS Policies
ALTER TABLE ai_recognition_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recognition attempts" ON ai_recognition_attempts;
CREATE POLICY "Users can view their own recognition attempts"
  ON ai_recognition_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attempts" ON ai_recognition_attempts;
CREATE POLICY "Users can insert their own attempts"
  ON ai_recognition_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own attempts" ON ai_recognition_attempts;
CREATE POLICY "Users can update their own attempts"
  ON ai_recognition_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Only admins can view/modify AI config
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can manage AI config" ON ai_config;
CREATE POLICY "Only admins can manage AI config"
  ON ai_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.hierarchy_level <= 10  -- Admin or Super Admin (assuming hierarchy logic exists)
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_config_updated_at ON ai_config;
CREATE TRIGGER ai_config_updated_at
  BEFORE UPDATE ON ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_updated_at();

-- Insert default AI config
INSERT INTO ai_config (
  provider,
  model_name,
  is_active,
  is_system_provided,
  rate_limit_per_minute,
  max_image_size_mb,
  supported_formats
) VALUES (
  'google',
  'gemini-1.5-flash',
  false,  -- Inactive until API key is added
  true,
  60,
  4,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) 
ON CONFLICT DO NOTHING; -- Assuming there might be a unique constraint or just relying on random ID

-- Add new permission for AI features
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'ai' AND action = 'use') THEN
        INSERT INTO permissions (module, action, display_name, description) 
        VALUES ('ai', 'use', 'Use AI Recognition', 'Use AI-powered product recognition during counting');
    END IF;
END $$;

-- Grant AI permission to all authenticated users by default
DO $$
DECLARE
  staff_role_id UUID;
  ai_permission_id UUID;
BEGIN
  -- Get staff role (lowest tier that should have access)
  SELECT id INTO staff_role_id FROM roles WHERE name = 'staff' LIMIT 1;
  
  -- Get AI permission
  SELECT id INTO ai_permission_id FROM permissions WHERE module = 'ai' AND action = 'use' LIMIT 1;
  
  -- Grant permission
  IF staff_role_id IS NOT NULL AND ai_permission_id IS NOT NULL THEN
     IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = staff_role_id AND permission_id = ai_permission_id) THEN
        INSERT INTO role_permissions (role_id, permission_id, granted)
        VALUES (staff_role_id, ai_permission_id, true);
     END IF;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE ai_recognition_attempts IS 'Audit trail for all AI product recognition attempts';
COMMENT ON TABLE ai_config IS 'Configuration for AI providers and models';
COMMENT ON COLUMN ai_recognition_attempts.match_confidence IS 'Confidence score from 0-100 for the product match';
COMMENT ON COLUMN ai_recognition_attempts.match_method IS 'Method used for matching: exact, fuzzy, manual, or none';
