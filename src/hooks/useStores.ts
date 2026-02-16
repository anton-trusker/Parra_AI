import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreRecord {
  id: string;
  name: string;
  code: string | null;
  store_type: string | null;
  syrve_store_id: string;
  is_active: boolean | null;
  synced_at: string | null;
}

/**
 * Fetches the selected_store_ids from syrve_config.
 * These are syrve_store_id values (not DB UUIDs).
 */
export function useSelectedStoreIds() {
  return useQuery({
    queryKey: ['selected_store_ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_config')
        .select('selected_store_ids')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.selected_store_ids as string[] | null) || [];
    },
  });
}

/**
 * Returns only the stores that are selected in syrve_config.
 * If no stores are selected, returns all active stores (fallback).
 */
export function useStores() {
  const { data: selectedSyrveIds = [] } = useSelectedStoreIds();

  return useQuery({
    queryKey: ['stores', selectedSyrveIds],
    queryFn: async () => {
      let query = supabase
        .from('stores')
        .select('id, name, code, store_type, syrve_store_id, is_active, synced_at')
        .eq('is_active', true)
        .order('name');

      // Filter to only selected stores if any are configured
      if (selectedSyrveIds.length > 0) {
        query = query.in('syrve_store_id', selectedSyrveIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StoreRecord[];
    },
  });
}

/**
 * Returns ALL stores regardless of selection (for admin/settings pages).
 */
export function useAllStores() {
  return useQuery({
    queryKey: ['all_stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, code, store_type, syrve_store_id, is_active, synced_at')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as StoreRecord[];
    },
  });
}
