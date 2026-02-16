-- Standardize ai_config RLS: authenticated SELECT, admin-only writes via has_role('admin')

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Drop legacy/inconsistent policies
DROP POLICY IF EXISTS "Only admins can manage AI config" ON public.ai_config;
DROP POLICY IF EXISTS "Admins manage ai_config" ON public.ai_config;
DROP POLICY IF EXISTS "Auth read ai_config" ON public.ai_config;
DROP POLICY IF EXISTS ai_config_auth_select ON public.ai_config;
DROP POLICY IF EXISTS ai_config_admin_all ON public.ai_config;

-- Create consistent policies
CREATE POLICY ai_config_auth_select ON public.ai_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY ai_config_admin_all ON public.ai_config
  FOR ALL
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

