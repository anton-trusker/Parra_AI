-- Ensure admin@trusker.com has super_admin role
-- Idempotent upsert based on existing auth.users entry

-- Optional: ensure app_roles_config has a Super Admin entry
-- Optional: ensure a "Super Admin" role config exists (role_name unique)
INSERT INTO public.app_roles_config (role_name, permissions, is_builtin)
VALUES ('Super Admin', '{}'::jsonb, true)
ON CONFLICT (role_name) DO NOTHING;

-- Assign super_admin to the target user if present
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::public.app_role
FROM auth.users AS u
WHERE lower(u.email) = lower('admin@trusker.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Optionally clean duplicates of legacy admin-only assignment (no-op if none)
-- This keeps admin role if previously assigned; super_admin supersedes in checks
