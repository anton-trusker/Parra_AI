import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type InventorySession = Tables<'inventory_sessions'>;
export type InventoryItem = Tables<'inventory_items'>;
type SessionInsert = TablesInsert<'inventory_sessions'>;
type SessionUpdate = TablesUpdate<'inventory_sessions'>;
type ItemInsert = TablesInsert<'inventory_items'>;

// ─── Queries ───

export function useInventorySessions(statusFilter?: string) {
  return useQuery({
    queryKey: ['inventory_sessions', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('inventory_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        q = q.eq('status', statusFilter as any);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as InventorySession[];
    },
  });
}

export function useInventorySession(id: string | undefined) {
  return useQuery({
    queryKey: ['inventory_session', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('inventory_sessions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as InventorySession;
    },
    enabled: !!id,
  });
}

export function useSessionItems(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['inventory_items', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('counted_at', { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!sessionId,
  });
}

// ─── Mutations ───

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SessionInsert) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as InventorySession;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_sessions'] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: SessionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as InventorySession;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inventory_sessions'] });
      qc.invalidateQueries({ queryKey: ['inventory_session', data.id] });
    },
  });
}

export function useAddInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemInsert) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      // Increment total_wines_counted on session
      await supabase.rpc('has_role', { _user_id: '', _role: 'admin' }).then(() => {}); // no-op
      return data as InventoryItem;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inventory_items', data.session_id] });
      qc.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}

export function useUpsertInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemInsert) => {
      // Check if item already exists for this session+wine
      const { data: existing } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('session_id', item.session_id)
        .eq('wine_id', item.wine_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('inventory_items')
          .update({
            counted_quantity_unopened: item.counted_quantity_unopened,
            counted_quantity_opened: item.counted_quantity_opened,
            counted_at: item.counted_at,
            counted_by: item.counted_by,
            counting_method: item.counting_method,
            location: item.location,
            notes: item.notes,
            confidence: item.confidence,
            count_status: 'counted',
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as InventoryItem;
      } else {
        const { data, error } = await supabase
          .from('inventory_items')
          .insert({ ...item, count_status: 'counted' })
          .select()
          .single();
        if (error) throw error;
        return data as InventoryItem;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inventory_items', data.session_id] });
      qc.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}

// Approve / Flag / Complete session
export function useApproveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approvedBy, notes }: { id: string; approvedBy: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          approval_notes: notes || null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_sessions'] }),
  });
}

export function useFlagSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update({
          status: 'flagged',
          flagged_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_sessions'] }),
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completedBy, duration, totalCounted }: { id: string; completedBy: string; duration: number; totalCounted: number }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: completedBy,
          duration_seconds: duration,
          total_wines_counted: totalCounted,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_sessions'] }),
  });
}
