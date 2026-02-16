import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  loginName?: string;
  avatarUrl?: string;
  avatarColor?: string;
  role: 'super_admin' | 'admin' | 'staff';
  isActive: boolean;
}

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (v: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  initialized: false,

  setSession: (session) => set({ session, isAuthenticated: !!session }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (initialized) => set({ initialized }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));

// Fetch profile + role for a given user id
export async function fetchAppUser(userId: string, email: string): Promise<AppUser | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const roles = (roleRows ?? []).map((r: any) => r.role as 'super_admin' | 'admin' | 'staff');
  const role = roles.includes('super_admin')
    ? 'super_admin'
    : roles.includes('admin')
    ? 'admin'
    : 'staff';

  return {
    id: userId,
    email,
    displayName: profile?.display_name || email,
    firstName: profile?.first_name || undefined,
    lastName: profile?.last_name || undefined,
    loginName: (profile as any)?.login_name || undefined,
    avatarUrl: profile?.avatar_url || undefined,
    avatarColor: profile?.avatar_color || undefined,
    role,
    isActive: profile?.is_active ?? true,
  };
}

// Permission helpers
export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === 'admin' || s.user?.role === 'super_admin');
}

export function hasPermission(module: string, _requiredLevel: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  // Admin and super_admin have full access
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  // Staff has limited access — for now allow view on most, restrict settings/users
  const restricted = ['settings', 'users'];
  if (restricted.includes(module)) return false;
  return true;
}

export function useHasPermission(module: string, requiredLevel: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  const restricted = ['settings', 'users'];
  if (restricted.includes(module)) return false;
  return true;
}

export function useUserRole() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const nameMap: Record<string, string> = { super_admin: 'Super Admin', admin: 'Admin', staff: 'Staff' };
  return { name: nameMap[user.role] || user.role, id: user.role };
}
