import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SessionStatus = 'draft' | 'in_progress' | 'completed' | 'paused' | 'approved' | 'flagged';

export interface InventorySession {
  id: string;
  session_name: string;
  session_type: string;
  status: SessionStatus;
  started_at: string;
  started_by: string | null;
  location_filter?: string | null;
  total_wines_counted: number;
  total_wines_expected: number;
}

export interface InventoryItem {
  id: string;
  session_id: string;
  wine_id: string;
  wine_name?: string; // joined
  wine_image?: string; // joined
  counted_quantity_unopened: number;
  counted_quantity_opened: number;
  expected_quantity_unopened: number;
  expected_quantity_opened: number;
  variance_total: number | null;
  counting_method: 'manual' | 'barcode' | 'image_ai' | null;
  notes?: string | null;
}

interface SessionStoreState {
  sessions: InventorySession[];
  currentSession: InventorySession | null;
  currentItems: InventoryItem[];
  loading: boolean;
  
  // Actions
  fetchSessions: () => Promise<void>;
  createSession: (type: string, name: string, location?: string) => Promise<string | null>;
  getSession: (id: string) => Promise<void>;
  updateSessionStatus: (id: string, status: SessionStatus) => Promise<boolean>;
  
  // Item actions
  fetchSessionItems: (sessionId: string) => Promise<void>;
  submitCount: (sessionId: string, wineId: string, unopened: number, opened: number, method: string) => Promise<boolean>;
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  sessions: [],
  currentSession: null,
  currentItems: [],
  loading: false,

  fetchSessions: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('inventory_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } else {
      set({ sessions: data as any[] });
    }
    set({ loading: false });
  },

  createSession: async (type, name, location) => {
    set({ loading: true });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      set({ loading: false });
      return null;
    }

    const { data, error } = await supabase
      .from('inventory_sessions')
      .insert([{
        session_name: name,
        session_type: type,
        status: 'in_progress',
        started_by: user.id,
        started_at: new Date().toISOString(),
        location_filter: location
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to start session');
      set({ loading: false });
      return null;
    }

    set({ currentSession: data as any, loading: false });
    return data.id;
  },

  getSession: async (id) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('inventory_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      set({ currentSession: null });
    } else {
      set({ currentSession: data as any });
    }
    set({ loading: false });
  },

  updateSessionStatus: async (id, status) => {
    const { error } = await supabase
      .from('inventory_sessions')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : undefined })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update session status');
      return false;
    }
    
    // Refresh
    get().getSession(id);
    return true;
  },

  fetchSessionItems: async (sessionId) => {
    set({ loading: true });
    
    // Join with wines/products to get names
    // Note: inventory_items links to wines via wine_id
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        wine:wines (
          id,
          product:products (name, image_url)
        )
      `)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      // Map joined data
      const items = data.map((item: any) => ({
        ...item,
        wine_name: item.wine?.product?.name || 'Unknown Wine',
        wine_image: item.wine?.product?.image_url
      }));
      set({ currentItems: items });
    }
    set({ loading: false });
  },

  submitCount: async (sessionId, wineId, unopened, opened, method) => {
    // Check if item exists in session
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('session_id', sessionId)
      .eq('wine_id', wineId)
      .maybeSingle();

    const payload = {
      session_id: sessionId,
      wine_id: wineId,
      counted_quantity_unopened: unopened,
      counted_quantity_opened: opened,
      counting_method: method,
      counted_at: new Date().toISOString(),
      // Calculate variance if we have expected values (would require fetching expected first)
      // For now, let DB trigger or future logic handle it
    };

    let error;
    if (existing) {
      const { error: err } = await supabase
        .from('inventory_items')
        .update(payload)
        .eq('id', existing.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('inventory_items')
        .insert([payload]);
      error = err;
    }

    if (error) {
      console.error('Error submitting count:', error);
      toast.error('Failed to save count');
      return false;
    }

    return true;
  }
}));
