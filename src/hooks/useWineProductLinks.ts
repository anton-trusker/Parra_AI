import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWineProductLinks() {
  return useQuery({
    queryKey: ['wine-product-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wines')
        .select('id, product_id')
        .not('product_id', 'is', null);
      if (error) throw error;
      // Map product_id -> wine_id
      const map = new Map<string, string>();
      for (const w of data || []) {
        if (w.product_id) map.set(w.product_id, w.id);
      }
      return map;
    },
    staleTime: 30_000,
  });
}
