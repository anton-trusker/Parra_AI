import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";
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
  fetchRoles: () => Promise<void>;
  addRole: (r: AppRole) => Promise<void>;
  updateRole: (id: string, updates: Partial<AppRole>) => Promise<void>;
  removeRole: (id: string) => Promise<void>;
  setRolePermission: (roleId: string, permissionKey: string, level: PermissionLevel) => Promise<void>;
  setModulePermissions: (roleId: string, moduleKey: string, level: PermissionLevel) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
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
  fetchRoles: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*');
      
      if (!error && data) {
          const mappedRoles: AppRole[] = data.map((r: any) => ({
              id: r.id,
              name: r.name,
              color: r.color || 'hsl(210, 40%, 50%)',
              isBuiltin: r.is_system_role || false,
              permissions: r.permissions as Record<string, PermissionLevel>
          }));
          set({ roles: mappedRoles });
      } else {
          console.error("Failed to fetch roles:", error);
      }
  },

  addRole: async (r) => {
      set((s) => ({ roles: [...s.roles, r] }));
      
      const { error } = await supabase.from('roles').insert({
          id: r.id, 
          name: r.name,
          color: r.color,
          permissions: r.permissions,
          is_system_role: r.isBuiltin,
          is_super_admin: false
      });

      if (error) {
          console.error("Failed to add role:", error);
          get().fetchRoles();
      }
  },

  updateRole: async (id, updates) => {
    set((s) => ({
      roles: s.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));

    const { error } = await supabase.from('roles').update({
        name: updates.name,
        color: updates.color,
        permissions: updates.permissions
    }).eq('id', id);

    if (error) {
        console.error("Failed to update role:", error);
        get().fetchRoles();
    }
  },

  removeRole: async (id) => {
    set((s) => ({
      roles: s.roles.filter((r) => r.id !== id || r.isBuiltin),
    }));

    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) {
        console.error("Failed to delete role:", error);
        get().fetchRoles();
    }
  },

  setRolePermission: async (roleId, permissionKey, level) => {
    const currentRole = get().roles.find(r => r.id === roleId);
    if (!currentRole) return;

    const newPermissions = { ...currentRole.permissions, [permissionKey]: level };
    
    set((s) => ({
      roles: s.roles.map((r) =>
        r.id === roleId ? { ...r, permissions: newPermissions } : r
      ),
    }));

    const { error } = await supabase.from('roles').update({
        permissions: newPermissions
    }).eq('id', roleId);

    if (error) get().fetchRoles();
  },

  setModulePermissions: async (roleId, moduleKey, level) => {
    const mod = ALL_MODULES.find(m => m.key === moduleKey);
    if (!mod) return;
    
    const currentRole = get().roles.find(r => r.id === roleId);
    if (!currentRole) return;

    const newPermissions = { ...currentRole.permissions };
    mod.subActions.forEach(a => { newPermissions[permKey(mod.key, a.key)] = level; });

    set((s) => ({
      roles: s.roles.map((r) =>
        r.id === roleId ? { ...r, permissions: newPermissions } : r
      ),
    }));

    const { error } = await supabase.from('roles').update({
        permissions: newPermissions
    }).eq('id', roleId);

    if (error) get().fetchRoles();
  },
}));
