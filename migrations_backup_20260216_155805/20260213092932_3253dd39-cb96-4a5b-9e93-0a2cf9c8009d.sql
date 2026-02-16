
-- Add missing roles: Super Admin, Manager, Viewer
INSERT INTO public.app_roles_config (id, role_name, is_builtin, color, permissions)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Super Admin', true, '#7c3aed', '{"dashboard":"full","catalog":"full","stock":"full","sessions":"full","history":"full","reports":"full","settings":"full","users":"full"}'),
  ('00000000-0000-0000-0000-000000000002', 'Manager', true, '#2563eb', '{"dashboard":"full","catalog":"full","stock":"full","sessions":"full","history":"full","reports":"full","settings":"view","users":"view"}'),
  ('00000000-0000-0000-0000-000000000004', 'Viewer', true, '#6b7280', '{"dashboard":"view","catalog":"view","stock":"view","sessions":"view","history":"view","reports":"view","settings":"none","users":"none"}')
ON CONFLICT (id) DO NOTHING;
