-- Add RLS policies for profiles, user_roles, app_roles_config
-- Idempotent by dropping/recreating named policies

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_auth_select_own ON public.profiles;
CREATE POLICY profiles_auth_select_own ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_auth_update_own ON public.profiles;
CREATE POLICY profiles_auth_update_own ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_all_select ON public.profiles;
CREATE POLICY profiles_admin_all_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role('admin'));

DROP POLICY IF EXISTS profiles_admin_all_write ON public.profiles;
CREATE POLICY profiles_admin_all_write ON public.profiles
  FOR ALL
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_auth_select_own ON public.user_roles;
CREATE POLICY user_roles_auth_select_own ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- APP_ROLES_CONFIG
ALTER TABLE public.app_roles_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_roles_config_auth_select ON public.app_roles_config;
CREATE POLICY app_roles_config_auth_select ON public.app_roles_config
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS app_roles_config_admin_all ON public.app_roles_config;
CREATE POLICY app_roles_config_admin_all ON public.app_roles_config
  FOR ALL
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

