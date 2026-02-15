import { create } from 'zustand';
import {
  AppRole,
  PermissionLevel,
  defaultRoles,
  ALL_MODULES,
  permKey,
} from '@/data/referenceData';

interface SettingsState {
  roles: AppRole[];
  openedBottleUnit: 'fraction' | 'litres';

  setOpenedBottleUnit: (unit: 'fraction' | 'litres') => void;

  // Roles
  addRole: (r: AppRole) => void;
  updateRole: (id: string, updates: Partial<AppRole>) => void;
  removeRole: (id: string) => void;
  setRolePermission: (roleId: string, permissionKey: string, level: PermissionLevel) => void;
  setModulePermissions: (roleId: string, moduleKey: string, level: PermissionLevel) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  roles: defaultRoles,
  openedBottleUnit: 'fraction',

  setOpenedBottleUnit: (unit) => set({ openedBottleUnit: unit }),

  // Roles
  addRole: (r) => set((s) => ({ roles: [...s.roles, r] })),
  updateRole: (id, updates) => set((s) => ({
    roles: s.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  })),
  removeRole: (id) => set((s) => ({
    roles: s.roles.filter((r) => r.id !== id || r.isBuiltin),
  })),
  setRolePermission: (roleId, permissionKey, level) => set((s) => ({
    roles: s.roles.map((r) =>
      r.id === roleId ? { ...r, permissions: { ...r.permissions, [permissionKey]: level } } : r
    ),
  })),
  setModulePermissions: (roleId, moduleKey, level) => set((s) => {
    const mod = ALL_MODULES.find(m => m.key === moduleKey);
    if (!mod) return {};
    return {
      roles: s.roles.map((r) => {
        if (r.id !== roleId) return r;
        const newPerms = { ...r.permissions };
        mod.subActions.forEach(a => { newPerms[permKey(mod.key, a.key)] = level; });
        return { ...r, permissions: newPerms };
      }),
    };
  }),
}));
