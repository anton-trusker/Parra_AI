import { create } from 'zustand';
import { useSettingsStore } from '@/stores/settingsStore';
import { ALL_MODULES, permKey } from '@/data/referenceData';
import type { ModuleKey, PermissionLevel } from '@/data/referenceData';

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string; // references AppRole.id
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@wine.com': {
    password: 'admin123',
    user: { id: '1', name: 'Marco Rossi', email: 'admin@wine.com', roleId: 'role_admin' },
  },
  'staff@wine.com': {
    password: 'staff123',
    user: { id: '2', name: 'Sarah Miller', email: 'staff@wine.com', roleId: 'role_staff' },
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string, password: string) => {
    const record = MOCK_USERS[email];
    if (record && record.password === password) {
      set({ user: record.user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));

const HIERARCHY: PermissionLevel[] = ['none', 'view', 'edit', 'full'];

function resolveLevel(role: { permissions: Record<string, PermissionLevel> }, key: string): PermissionLevel {
  // Direct key match (e.g. "catalog.add_edit_wines")
  if (role.permissions[key] !== undefined) return role.permissions[key];
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
