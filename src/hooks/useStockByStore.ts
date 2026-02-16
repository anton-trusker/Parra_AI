import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockByStore {
  product_id: string;
  product_name: string;
  category_name: string;
  sku: string;
  stores: {
    store_id: string;
    store_name: string;
    unopened: number;
    open_ml: number;
    last_counted: string | null;
  }[];
  total_unopened: number;
  total_open_ml: number;
}

export interface StockByStoreFilters {
  storeIds?: string[];
  categoryIds?: string[];
  search?: string;
  businessId?: string;
}

export function useStockByStore(filters?: StockByStoreFilters) {
  return useQuery({
    queryKey: ['stock_by_store', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_stock_by_store', {
          p_business_id: filters?.businessId,
          p_store_ids: filters?.storeIds,
          p_category_ids: filters?.categoryIds,
          p_search: filters?.search
        });
      
      if (error) throw error;
      return data as StockByStore[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters?.businessId, // Only fetch when business ID is provided
  });
}