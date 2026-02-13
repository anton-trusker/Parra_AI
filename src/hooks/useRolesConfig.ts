import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PermissionLevel } from '@/data/referenceData';
import { ALL_MODULES, permKey, buildPermissions } from '@/data/referenceData';

export interface RoleConfigRow {
  id: string;
  role_name: string;
  color: string | null;
  is_builtin: boolean;
  permissions: Record<string, PermissionLevel>;
  created_at: string;
  updated_at: string;
}

export function useRolesConfig() {
  return useQuery({
    queryKey: ['app_roles_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_roles_config')
        .select('*')
        .order('is_builtin', { ascending: false })
        .order('role_name');
      if (error) throw error;
      return (data ?? []).map(r => ({
        ...r,
        permissions: (r.permissions ?? {}) as Record<string, PermissionLevel>,
      })) as RoleConfigRow[];
    },
  });
}

export function useAddRoleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (role: { role_name: string; color: string; permissions: Record<string, PermissionLevel> }) => {
      const { error } = await supabase.from('app_roles_config').insert({
        role_name: role.role_name,
        color: role.color,
        permissions: role.permissions as any,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_roles_config'] }),
  });
}

export function useUpdateRoleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ role_name: string; color: string; permissions: Record<string, PermissionLevel> }> }) => {
      const payload: any = {};
      if (updates.role_name !== undefined) payload.role_name = updates.role_name;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.permissions !== undefined) payload.permissions = updates.permissions;
      const { error } = await supabase.from('app_roles_config').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_roles_config'] }),
  });
}

export function useRemoveRoleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('app_roles_config').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_roles_config'] }),
  });
}

export function useSetRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, currentPermissions, permissionKey, level }: {
      roleId: string;
      currentPermissions: Record<string, PermissionLevel>;
      permissionKey: string;
      level: PermissionLevel;
    }) => {
      const newPerms = { ...currentPermissions, [permissionKey]: level };
      const { error } = await supabase.from('app_roles_config').update({ permissions: newPerms as any }).eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_roles_config'] }),
  });
}

export function useSetModulePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, currentPermissions, moduleKey, level }: {
      roleId: string;
      currentPermissions: Record<string, PermissionLevel>;
      moduleKey: string;
      level: PermissionLevel;
    }) => {
      const mod = ALL_MODULES.find(m => m.key === moduleKey);
      if (!mod) return;
      const newPerms = { ...currentPermissions };
      mod.subActions.forEach(a => { newPerms[permKey(mod.key, a.key)] = level; });
      const { error } = await supabase.from('app_roles_config').update({ permissions: newPerms as any }).eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_roles_config'] }),
  });
}
