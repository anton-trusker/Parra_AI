import { create } from 'zustand';
import {
  GlassDimension,
  LocationConfig,
  SubLocation,
  VolumeOption,
  AppRole,
  PermissionLevel,
  defaultGlassDimensions,
  defaultLocations,
  defaultVolumes,
  defaultRoles,
  ALL_MODULES,
  permKey,
} from '@/data/referenceData';

interface SettingsState {
  glassDimensions: GlassDimension[];
  locations: LocationConfig[];
  volumes: VolumeOption[];
  roles: AppRole[];
  openedBottleUnit: 'fraction' | 'litres';

  addGlassDimension: (g: GlassDimension) => void;
  removeGlassDimension: (id: string) => void;
  addLocation: (l: LocationConfig) => void;
  removeLocation: (id: string) => void;
  addSubLocation: (locationId: string, sub: SubLocation) => void;
  removeSubLocation: (locationId: string, subId: string) => void;
  addVolume: (v: VolumeOption) => void;
  removeVolume: (id: string) => void;
  setOpenedBottleUnit: (unit: 'fraction' | 'litres') => void;

  // Roles
  addRole: (r: AppRole) => void;
  updateRole: (id: string, updates: Partial<AppRole>) => void;
  removeRole: (id: string) => void;
  setRolePermission: (roleId: string, permissionKey: string, level: PermissionLevel) => void;
  setModulePermissions: (roleId: string, moduleKey: string, level: PermissionLevel) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  glassDimensions: defaultGlassDimensions,
  locations: defaultLocations,
  volumes: defaultVolumes,
  roles: defaultRoles,
  openedBottleUnit: 'fraction',

  addGlassDimension: (g) => set((s) => ({ glassDimensions: [...s.glassDimensions, g] })),
  removeGlassDimension: (id) => set((s) => ({ glassDimensions: s.glassDimensions.filter((g) => g.id !== id) })),

  addLocation: (l) => set((s) => ({ locations: [...s.locations, l] })),
  removeLocation: (id) => set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),
  addSubLocation: (locationId, sub) => set((s) => ({
    locations: s.locations.map((l) =>
      l.id === locationId ? { ...l, subLocations: [...l.subLocations, sub] } : l
    ),
  })),
  removeSubLocation: (locationId, subId) => set((s) => ({
    locations: s.locations.map((l) =>
      l.id === locationId ? { ...l, subLocations: l.subLocations.filter((s) => s.id !== subId) } : l
    ),
  })),

  addVolume: (v) => set((s) => ({ volumes: [...s.volumes, v] })),
  removeVolume: (id) => set((s) => ({ volumes: s.volumes.filter((v) => v.id !== id) })),
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
