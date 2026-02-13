import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───

export interface InventoryCountEvent {
  id: string;
  session_id: string;
  product_id: string;
  variant_id: string | null;
  user_id: string;
  bottle_qty: number;
  open_ml: number;
  derived_liters: number;
  source: 'camera_ai' | 'manual_search' | 'manual_barcode' | 'manager_adjustment';
  confidence: number | null;
  photo_url: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface InventoryBaselineItem {
  id: string;
  session_id: string;
  product_id: string;
  variant_id: string | null;
  expected_qty: number;
  expected_liters: number;
  raw_stock_payload: any;
  created_at: string;
}

export interface InventoryProductAggregate {
  id: string;
  session_id: string;
  product_id: string;
  variant_id: string | null;
  counted_qty_total: number;
  counted_liters_total: number;
  event_count: number;
  last_updated_at: string;
}

// ─── Queries ───

/** Fetch immutable baseline items for a session */
export function useBaselineItems(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['inventory_baseline_items', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('inventory_baseline_items' as any)
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return (data || []) as unknown as InventoryBaselineItem[];
    },
    enabled: !!sessionId,
  });
}

/** Fetch all count events for a session (audit trail) */
export function useCountEvents(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['inventory_count_events', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('inventory_count_events' as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InventoryCountEvent[];
    },
    enabled: !!sessionId,
  });
}

/** Fetch per-user count events for a session */
export function useUserCountEvents(sessionId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['inventory_count_events', sessionId, userId],
    queryFn: async () => {
      if (!sessionId || !userId) return [];
      const { data, error } = await supabase
        .from('inventory_count_events' as any)
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InventoryCountEvent[];
    },
    enabled: !!sessionId && !!userId,
  });
}

/** Fetch cached aggregates for a session (expected vs counted view) */
export function useProductAggregates(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['inventory_product_aggregates', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('inventory_product_aggregates' as any)
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return (data || []) as unknown as InventoryProductAggregate[];
    },
    enabled: !!sessionId,
  });
}

// ─── Mutations ───

interface AddCountEventInput {
  session_id: string;
  product_id: string;
  variant_id?: string | null;
  user_id: string;
  bottle_qty: number;
  open_ml?: number;
  derived_liters?: number;
  source: 'camera_ai' | 'manual_search' | 'manual_barcode' | 'manager_adjustment';
  confidence?: number | null;
  photo_url?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
}

/** Append-only: add a count event. Aggregates update automatically via DB trigger. */
export function useAddCountEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddCountEventInput) => {
      const { data, error } = await supabase
        .from('inventory_count_events' as any)
        .insert({
          session_id: input.session_id,
          product_id: input.product_id,
          variant_id: input.variant_id || null,
          user_id: input.user_id,
          bottle_qty: input.bottle_qty,
          open_ml: input.open_ml || 0,
          derived_liters: input.derived_liters || 0,
          source: input.source,
          confidence: input.confidence || null,
          photo_url: input.photo_url || null,
          notes: input.notes || null,
          metadata: input.metadata || {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as InventoryCountEvent;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inventory_count_events', data.session_id] });
      qc.invalidateQueries({ queryKey: ['inventory_product_aggregates', data.session_id] });
      qc.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}
