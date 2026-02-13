import { create } from 'zustand';
import { useSettingsStore } from '@/stores/settingsStore';
import { ALL_MODULES, permKey } from '@/data/referenceData';
import type { ModuleKey, PermissionLevel } from '@/data/referenceData';
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  name: string;
  email: string;
  loginName: string;
  roleId: string; // references AppRole.id
  isSuperAdmin?: boolean;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginName: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (loginName: string, password: string) => {
    set({ isLoading: true });
    const email = `${loginName}@inventory.local`;

    // Try Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("Login error:", error);
      set({ isLoading: false });
      return false;
    }

    // Fetch Profile to get real Role ID and details
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            *,
            roles (
                id,
                name,
                is_super_admin,
                permissions
            )
        `)
        .eq('id', data.user.id)
        .single();
    
    if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        await supabase.auth.signOut();
        set({ isLoading: false });
        return false;
    }

    // Map Supabase user to our internal User structure
    const user: User = {
      id: data.user.id,
      name: profile.full_name || loginName,
      email: data.user.email || email,
      loginName: profile.login_name || loginName,
      roleId: profile.role_id,
      isSuperAdmin: profile.roles?.is_super_admin || false,
      avatar: data.user.user_metadata?.avatar_url
    };

    set({ user, isAuthenticated: true, isLoading: false });
    return true;
  },
  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  initialize: async () => {
    set({ isLoading: true });
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
        const { data: profile } = await supabase
        .from('profiles')
        .select(`
            *,
            roles (
                id,
                name,
                is_super_admin,
                permissions
            )
        `)
        .eq('id', data.session.user.id)
        .single();

        if (profile) {
            const user: User = {
                id: data.session.user.id,
                name: profile.full_name || 'User',
                email: data.session.user.email || '',
                loginName: profile.login_name || '',
                roleId: profile.role_id,
                isSuperAdmin: profile.roles?.is_super_admin || false,
                avatar: data.session.user.user_metadata?.avatar_url
            };
            set({ user, isAuthenticated: true });
        }
    }
    console.log("Auth store initialized");
    set({ isLoading: false });
  },
}));

const HIERARCHY: PermissionLevel[] = ['none', 'view', 'edit', 'full'];

function resolveLevel(role: { permissions: Record<string, PermissionLevel> }, key: string): PermissionLevel {
  // Check wildcard first
  if (role.permissions && role.permissions['*']) return role.permissions['*'];

  // Direct key match (e.g. "catalog.add_edit_wines")
  if (role.permissions && role.permissions[key] !== undefined) return role.permissions[key];
  return 'none';
}

// Check module-level: returns the highest level across all sub-actions of a module
function resolveModuleLevel(role: { permissions: Record<string, PermissionLevel> }, moduleKey: ModuleKey): PermissionLevel {
  const mod = ALL_MODULES.find(m => m.key === moduleKey);
  if (!mod) return 'none';
  let best = 0;
  for (const a of mod.subActions) {
    const lvl = HIERARCHY.indexOf(resolveLevel(role, permKey(moduleKey, a.key)));
    if (lvl > best) best = lvl;
  }
  return HIERARCHY[best];
}

/**
 * Permission helper — supports both:
 *  - module-level: hasPermission('catalog', 'view') → highest sub-action level
 *  - sub-action:   hasPermission('catalog.add_edit_wines', 'edit')
 */
export function hasPermission(module: string, requiredLevel: PermissionLevel): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  const roles = useSettingsStore.getState().roles;
  const role = roles.find((r) => r.id === user.roleId);
  if (!role) return false;

  const level = module.includes('.')
    ? resolveLevel(role, module)
    : resolveModuleLevel(role, module as ModuleKey);
  return HIERARCHY.indexOf(level) >= HIERARCHY.indexOf(requiredLevel);
}

// Hook for reactive permission checking
export function useHasPermission(module: string, requiredLevel: PermissionLevel): boolean {
  const user = useAuthStore((s) => s.user);
  const roles = useSettingsStore((s) => s.roles);
  if (!user) return false;
  const role = roles.find((r) => r.id === user.roleId);
  if (!role) return false;

  const level = module.includes('.')
    ? resolveLevel(role, module)
    : resolveModuleLevel(role, module as ModuleKey);
  return HIERARCHY.indexOf(level) >= HIERARCHY.indexOf(requiredLevel);
}

// Get user's role object
export function useUserRole() {
  const user = useAuthStore((s) => s.user);
  const roles = useSettingsStore((s) => s.roles);
  if (!user) return null;
  return roles.find((r) => r.id === user.roleId) ?? null;
}
