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

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
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
