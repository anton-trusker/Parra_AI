import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type InventoryMovement = Tables<'inventory_movements'>;

export function useWineMovements(wineId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['wine-movements', wineId, limit],
    queryFn: async () => {
      if (!wineId) return [];
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('wine_id', wineId)
        .order('performed_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as InventoryMovement[];
    },
    enabled: !!wineId,
  });
}
