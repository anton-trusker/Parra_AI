
-- ============================================================
-- MIGRATION 5: Audit, Logging, Settings, App Roles Config, Storage
-- ============================================================

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  description TEXT,
  reason TEXT,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Error logs
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT,
  error_code TEXT,
  error_message TEXT,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id),
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System notifications
CREATE TABLE public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  notification_type TEXT DEFAULT 'info',
  related_entity_type TEXT,
  related_entity_id TEXT,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User activity log
CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT,
  changes JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Settings / Reference Data Tables
-- ============================================================

CREATE TABLE public.glass_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  volume_litres NUMERIC(6,4) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sub_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.volume_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ml INT NOT NULL,
  label TEXT NOT NULL,
  bottle_size TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- App roles config (for the RBAC permission matrix)
CREATE TABLE public.app_roles_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glass_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_roles_config ENABLE ROW LEVEL SECURITY;

-- Audit/error logs: admins read, system writes via service role
CREATE POLICY "Admins read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read error_logs" ON public.error_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert error_logs" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert activity" ON public.user_activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins read activity" ON public.user_activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notifications: users see own
CREATE POLICY "Users read own notifications" ON public.system_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.system_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.system_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Settings tables: auth read, admin write
CREATE POLICY "Auth read glass_dimensions" ON public.glass_dimensions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read locations" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read sub_locations" ON public.sub_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read volume_options" ON public.volume_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read app_settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read app_roles_config" ON public.app_roles_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage glass_dimensions" ON public.glass_dimensions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage locations" ON public.locations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage sub_locations" ON public.sub_locations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage volume_options" ON public.volume_options FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage app_settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage app_roles_config" ON public.app_roles_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_at ON public.audit_logs (performed_at);
CREATE INDEX idx_notifications_user ON public.system_notifications (user_id, is_read);
CREATE INDEX idx_sub_locations_location ON public.sub_locations (location_id);

-- Trigger for app_roles_config updated_at
CREATE TRIGGER update_app_roles_config_updated_at BEFORE UPDATE ON public.app_roles_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Storage bucket for wine images
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('wine-images', 'wine-images', true);

-- Storage RLS
CREATE POLICY "Public read wine images" ON storage.objects FOR SELECT USING (bucket_id = 'wine-images');
CREATE POLICY "Auth upload wine images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wine-images');
CREATE POLICY "Auth update wine images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'wine-images');
CREATE POLICY "Admins delete wine images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wine-images' AND public.has_role(auth.uid(), 'admin'));
