# Phase 4: Store Rewrites

## Overview

Migrate Zustand stores from mock data to Supabase-backed operations using React Query for caching and optimistic updates.

---

## Prerequisites

- [ ] Phase 3 completed (authentication working)
- [ ] Supabase client configured
- [ ] Database tables populated with seed data

---

## Store Architecture

```
src/stores/
├── authStore.ts        # ✅ Updated in Phase 3
├── settingsStore.ts    # Settings & reference data
├── sessionStore.ts     # Inventory sessions
├── countStore.ts       # Active counting state
└── themeStore.ts       # UI theme (local only)
```

---

## 1. Settings Store

**File:** `src/stores/settingsStore.ts`

```typescript
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

// Types
interface GlassDimension {
  id: string;
  label: string;
  volume_litres: number;
  is_active: boolean;
}

interface Location {
  id: string;
  name: string;
  type: string | null;
  is_active: boolean;
  subLocations?: SubLocation[];
}

interface SubLocation {
  id: string;
  location_id: string;
  name: string;
  is_active: boolean;
}

interface VolumeOption {
  id: string;
  label: string;
  ml: number;
  bottle_size: string | null;
  is_active: boolean;
}

interface RoleConfig {
  id: string;
  role_name: string;
  color: string | null;
  permissions: Record<string, boolean>;
  is_builtin: boolean;
}

interface SettingsState {
  glassDimensions: GlassDimension[];
  locations: Location[];
  volumeOptions: VolumeOption[];
  roles: RoleConfig[];
  isLoading: boolean;
  error: string | null;

  // Loaders
  loadGlassDimensions: () => Promise<void>;
  loadLocations: () => Promise<void>;
  loadVolumeOptions: () => Promise<void>;
  loadRoles: () => Promise<void>;
  loadAll: () => Promise<void>;

  // Glass Dimensions CRUD
  addGlassDimension: (data: Omit<GlassDimension, 'id'>) => Promise<void>;
  updateGlassDimension: (id: string, data: Partial<GlassDimension>) => Promise<void>;
  deleteGlassDimension: (id: string) => Promise<void>;

  // Locations CRUD
  addLocation: (data: Omit<Location, 'id' | 'subLocations'>) => Promise<void>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  addSubLocation: (locationId: string, name: string) => Promise<void>;
  deleteSubLocation: (id: string) => Promise<void>;

  // Volume Options CRUD
  addVolumeOption: (data: Omit<VolumeOption, 'id'>) => Promise<void>;
  updateVolumeOption: (id: string, data: Partial<VolumeOption>) => Promise<void>;
  deleteVolumeOption: (id: string) => Promise<void>;

  // Roles CRUD
  updateRolePermissions: (id: string, permissions: Record<string, boolean>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  glassDimensions: [],
  locations: [],
  volumeOptions: [],
  roles: [],
  isLoading: false,
  error: null,

  // ========== LOADERS ==========

  loadGlassDimensions: async () => {
    const { data, error } = await supabase
      .from('glass_dimensions')
      .select('*')
      .eq('is_active', true)
      .order('volume_litres');

    if (error) throw error;
    set({ glassDimensions: data || [] });
  },

  loadLocations: async () => {
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (locError) throw locError;

    const { data: subLocations, error: subError } = await supabase
      .from('sub_locations')
      .select('*')
      .eq('is_active', true);

    if (subError) throw subError;

    const locationsWithSubs = (locations || []).map((loc) => ({
      ...loc,
      subLocations: (subLocations || []).filter((sub) => sub.location_id === loc.id),
    }));

    set({ locations: locationsWithSubs });
  },

  loadVolumeOptions: async () => {
    const { data, error } = await supabase
      .from('volume_options')
      .select('*')
      .eq('is_active', true)
      .order('ml');

    if (error) throw error;
    set({ volumeOptions: data || [] });
  },

  loadRoles: async () => {
    const { data, error } = await supabase
      .from('app_roles_config')
      .select('*')
      .order('role_name');

    if (error) throw error;
    set({ roles: data || [] });
  },

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().loadGlassDimensions(),
        get().loadLocations(),
        get().loadVolumeOptions(),
        get().loadRoles(),
      ]);
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ========== GLASS DIMENSIONS ==========

  addGlassDimension: async (data) => {
    const { data: newItem, error } = await supabase
      .from('glass_dimensions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ glassDimensions: [...state.glassDimensions, newItem] }));
  },

  updateGlassDimension: async (id, data) => {
    const { error } = await supabase
      .from('glass_dimensions')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      glassDimensions: state.glassDimensions.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }));
  },

  deleteGlassDimension: async (id) => {
    const { error } = await supabase
      .from('glass_dimensions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      glassDimensions: state.glassDimensions.filter((item) => item.id !== id),
    }));
  },

  // ========== LOCATIONS ==========

  addLocation: async (data) => {
    const { data: newItem, error } = await supabase
      .from('locations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      locations: [...state.locations, { ...newItem, subLocations: [] }],
    }));
  },

  updateLocation: async (id, data) => {
    const { error } = await supabase
      .from('locations')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      locations: state.locations.map((loc) =>
        loc.id === id ? { ...loc, ...data } : loc
      ),
    }));
  },

  deleteLocation: async (id) => {
    const { error } = await supabase
      .from('locations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      locations: state.locations.filter((loc) => loc.id !== id),
    }));
  },

  addSubLocation: async (locationId, name) => {
    const { data: newItem, error } = await supabase
      .from('sub_locations')
      .insert({ location_id: locationId, name })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      locations: state.locations.map((loc) =>
        loc.id === locationId
          ? { ...loc, subLocations: [...(loc.subLocations || []), newItem] }
          : loc
      ),
    }));
  },

  deleteSubLocation: async (id) => {
    const { error } = await supabase
      .from('sub_locations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      locations: state.locations.map((loc) => ({
        ...loc,
        subLocations: loc.subLocations?.filter((sub) => sub.id !== id),
      })),
    }));
  },

  // ========== VOLUME OPTIONS ==========

  addVolumeOption: async (data) => {
    const { data: newItem, error } = await supabase
      .from('volume_options')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ volumeOptions: [...state.volumeOptions, newItem] }));
  },

  updateVolumeOption: async (id, data) => {
    const { error } = await supabase
      .from('volume_options')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      volumeOptions: state.volumeOptions.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }));
  },

  deleteVolumeOption: async (id) => {
    const { error } = await supabase
      .from('volume_options')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      volumeOptions: state.volumeOptions.filter((item) => item.id !== id),
    }));
  },

  // ========== ROLES ==========

  updateRolePermissions: async (id, permissions) => {
    const { error } = await supabase
      .from('app_roles_config')
      .update({ permissions })
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      roles: state.roles.map((role) =>
        role.id === id ? { ...role, permissions } : role
      ),
    }));
  },
}));
```

---

## 2. Session Store

**File:** `src/stores/sessionStore.ts`

```typescript
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { InventorySession, InventoryItem, SessionStatus } from '@/integrations/supabase/types';

interface SessionWithItems extends InventorySession {
  items: InventoryItem[];
  wines?: any[];
}

interface SessionState {
  sessions: InventorySession[];
  currentSession: SessionWithItems | null;
  isLoading: boolean;
  error: string | null;

  // Session Management
  loadSessions: (status?: SessionStatus) => Promise<void>;
  createSession: (data: Partial<InventorySession>) => Promise<string>;
  updateSession: (id: string, data: Partial<InventorySession>) => Promise<void>;
  loadSessionWithItems: (id: string) => Promise<void>;
  startSession: (id: string) => Promise<void>;
  completeSession: (id: string) => Promise<void>;
  approveSession: (id: string, notes?: string) => Promise<void>;
  flagSession: (id: string, reason: string) => Promise<void>;

  // Item Management
  addItem: (item: Partial<InventoryItem>) => Promise<void>;
  updateItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  loadSessions: async (status) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('inventory_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      set({ sessions: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createSession: async (data) => {
    const { data: session, error } = await supabase
      .from('inventory_sessions')
      .insert({
        session_name: data.session_name || `Count ${new Date().toLocaleDateString()}`,
        session_type: data.session_type || 'full',
        status: 'draft',
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    set((state) => ({ sessions: [session, ...state.sessions] }));
    return session.id;
  },

  updateSession: async (id, data) => {
    const { error } = await supabase
      .from('inventory_sessions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
      currentSession: state.currentSession?.id === id
        ? { ...state.currentSession, ...data }
        : state.currentSession,
    }));
  },

  loadSessionWithItems: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Load session
      const { data: session, error: sessionError } = await supabase
        .from('inventory_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;

      // Load items with wine data
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          wine:wines(id, name, producer, vintage, primary_barcode, current_stock_unopened, current_stock_opened)
        `)
        .eq('session_id', id)
        .order('counted_at', { ascending: false });

      if (itemsError) throw itemsError;

      set({
        currentSession: {
          ...session,
          items: items || [],
        },
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  startSession: async (id) => {
    const { user } = await supabase.auth.getUser();
    await get().updateSession(id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
      started_by: user.data.user?.id,
    });
  },

  completeSession: async (id) => {
    const { user } = await supabase.auth.getUser();
    const session = get().currentSession;

    await get().updateSession(id, {
      status: 'pending_review',
      completed_at: new Date().toISOString(),
      completed_by: user.data.user?.id,
      total_wines_counted: session?.items.filter((i) => i.counted_at).length || 0,
    });
  },

  approveSession: async (id, notes) => {
    const { user } = await supabase.auth.getUser();
    
    await get().updateSession(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.data.user?.id,
      approval_notes: notes,
    });

    // Log approval in audit
    await supabase.from('audit_logs').insert({
      user_id: user.data.user?.id,
      action: 'approve',
      entity_type: 'inventory_session',
      entity_id: id,
      description: `Session approved${notes ? `: ${notes}` : ''}`,
    });
  },

  flagSession: async (id, reason) => {
    await get().updateSession(id, {
      status: 'flagged',
      flagged_reason: reason,
    });

    const { user } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      user_id: user.data.user?.id,
      action: 'flag',
      entity_type: 'inventory_session',
      entity_id: id,
      description: `Session flagged: ${reason}`,
    });
  },

  addItem: async (item) => {
    const { user } = await supabase.auth.getUser();
    
    const { data: newItem, error } = await supabase
      .from('inventory_items')
      .insert({
        ...item,
        counted_by: user.data.user?.id,
        counted_at: new Date().toISOString(),
      })
      .select(`
        *,
        wine:wines(id, name, producer, vintage, primary_barcode)
      `)
      .single();

    if (error) throw error;

    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            items: [newItem, ...state.currentSession.items],
            total_wines_counted: (state.currentSession.total_wines_counted || 0) + 1,
          }
        : null,
    }));
  },

  updateItem: async (id, data) => {
    const { error } = await supabase
      .from('inventory_items')
      .update(data)
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            items: state.currentSession.items.map((item) =>
              item.id === id ? { ...item, ...data } : item
            ),
          }
        : null,
    }));
  },

  clearCurrentSession: () => set({ currentSession: null }),
}));
```

---

## 3. Count Store (Active Counting State)

**File:** `src/stores/countStore.ts`

```typescript
import { create } from 'zustand';

interface CountingState {
  sessionId: string | null;
  countMethod: 'manual' | 'barcode' | 'image_ai';
  selectedWineId: string | null;
  unopenedCount: number;
  openedCount: number;
  notes: string;
  scannerActive: boolean;
  
  // Actions
  setSession: (id: string) => void;
  setCountMethod: (method: 'manual' | 'barcode' | 'image_ai') => void;
  selectWine: (wineId: string | null) => void;
  setUnopened: (count: number) => void;
  setOpened: (count: number) => void;
  setNotes: (notes: string) => void;
  setScannerActive: (active: boolean) => void;
  incrementUnopened: () => void;
  incrementOpened: () => void;
  decrementUnopened: () => void;
  decrementOpened: () => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  countMethod: 'manual' as const,
  selectedWineId: null,
  unopenedCount: 0,
  openedCount: 0,
  notes: '',
  scannerActive: false,
};

export const useCountStore = create<CountingState>((set) => ({
  ...initialState,

  setSession: (id) => set({ sessionId: id }),
  setCountMethod: (method) => set({ countMethod: method }),
  selectWine: (wineId) => set({ 
    selectedWineId: wineId,
    unopenedCount: 0,
    openedCount: 0,
    notes: '',
  }),
  setUnopened: (count) => set({ unopenedCount: Math.max(0, count) }),
  setOpened: (count) => set({ openedCount: Math.max(0, count) }),
  setNotes: (notes) => set({ notes }),
  setScannerActive: (active) => set({ scannerActive: active }),
  incrementUnopened: () => set((state) => ({ unopenedCount: state.unopenedCount + 1 })),
  incrementOpened: () => set((state) => ({ openedCount: state.openedCount + 1 })),
  decrementUnopened: () => set((state) => ({ 
    unopenedCount: Math.max(0, state.unopenedCount - 1) 
  })),
  decrementOpened: () => set((state) => ({ 
    openedCount: Math.max(0, state.openedCount - 1) 
  })),
  reset: () => set(initialState),
}));
```

---

## Verification Checklist

- [ ] Settings load from database correctly
- [ ] CRUD operations work for all settings
- [ ] Sessions create/update in database
- [ ] Items link to correct sessions and wines
- [ ] Audit logs created for approvals/flags
- [ ] Count store maintains local state correctly

---

## Next Phase

→ [Phase 5: Page Updates](./phase-05-page-updates.md)
