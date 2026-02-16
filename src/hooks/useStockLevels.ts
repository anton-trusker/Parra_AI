import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockLevel {
  id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  unit_id: string | null;
  unit_cost: number | null;
  source: string | null;
  last_synced_at: string | null;
  measurement_units?: { name: string; short_name: string | null } | null;
}

export function useStockLevelsByStore(storeId: string | null) {
  return useQuery({
    queryKey: ['stock_levels', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('stock_levels')
        .select('*, measurement_units(name, short_name)')
        .eq('store_id', storeId)
        .order('quantity', { ascending: false });
      if (error) throw error;
      return (data || []) as StockLevel[];
    },
    enabled: !!storeId,
  });
}

export function useStockSummaryByStore() {
  return useQuery({
    queryKey: ['stock_levels_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_levels')
        .select('store_id, quantity');
      if (error) throw error;

      const summary: Record<string, { totalQuantity: number; productCount: number }> = {};
      for (const row of data || []) {
        if (!summary[row.store_id]) {
          summary[row.store_id] = { totalQuantity: 0, productCount: 0 };
        }
        summary[row.store_id].totalQuantity += Number(row.quantity) || 0;
        summary[row.store_id].productCount += 1;
      }
      return summary;
    },
  });
}
