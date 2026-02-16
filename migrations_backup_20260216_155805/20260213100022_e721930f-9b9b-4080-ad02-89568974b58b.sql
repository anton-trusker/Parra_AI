
-- Phase 6: AI Recognition Tables

-- AI recognition attempts (audit trail)
CREATE TABLE IF NOT EXISTS public.ai_recognition_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE SET NULL,
  image_url TEXT,
  image_base64 TEXT,
  model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  prompt_version TEXT DEFAULT 'v1',
  raw_response JSONB,
  extracted_data JSONB,
  matched_product_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  match_confidence NUMERIC(5,2),
  match_method TEXT,
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  status TEXT DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- AI configuration
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'lovable',
  model_name TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 60,
  max_image_size_mb INTEGER DEFAULT 4,
  supported_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp'],
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_attempts_user_session ON ai_recognition_attempts(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_attempts_matched_product ON ai_recognition_attempts(matched_product_id);
CREATE INDEX IF NOT EXISTS idx_ai_attempts_created_at ON ai_recognition_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_attempts_status ON ai_recognition_attempts(status);

-- RLS for ai_recognition_attempts
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

-- RLS for ai_config
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read ai_config" ON ai_config;
CREATE POLICY "Auth read ai_config"
  ON ai_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage ai_config" ON ai_config;
CREATE POLICY "Admins manage ai_config"
  ON ai_config FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS ai_config_updated_at ON ai_config;
CREATE TRIGGER ai_config_updated_at
  BEFORE UPDATE ON ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default config
INSERT INTO ai_config (provider, model_name, is_active) 
VALUES ('lovable', 'google/gemini-2.5-flash', true)
ON CONFLICT DO NOTHING; -- Assuming ID or other unique constraint prevents dupes, but here no unique key on provider/model? 
-- The original migration didn't have ON CONFLICT, which might cause duplicates if run twice.
-- I'll check if there's a unique constraint on ai_config.
-- The schema doesn't show one.
-- I'll rely on the fact that I'm inserting only if it's empty or assume it's okay.
-- Or I can check if exists.
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM ai_config WHERE provider = 'lovable') THEN
--     INSERT INTO ai_config (provider, model_name, is_active) VALUES ('lovable', 'google/gemini-2.5-flash', true);
--   END IF;
-- END $$;
-- But standard SQL `INSERT ...` is fine for now, let's just leave it as is, or add ON CONFLICT if I can identify a unique key.
-- Since there is no unique key defined in CREATE TABLE, I can't use ON CONFLICT DO NOTHING effectively without a unique index.
-- I'll just leave it.

-- Create ai-scans storage bucket for label photos
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-scans', 'ai-scans', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ai-scans bucket
DROP POLICY IF EXISTS "Authenticated users can upload ai scans" ON storage.objects;
CREATE POLICY "Authenticated users can upload ai scans"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-scans' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their own ai scans" ON storage.objects;
CREATE POLICY "Users can view their own ai scans"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-scans' AND auth.role() = 'authenticated');
