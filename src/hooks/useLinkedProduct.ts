import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLinkedProduct(productId: string | null | undefined) {
  return useQuery({
    queryKey: ['linked-product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories ( id, name, syrve_group_id, parent_id )
        `)
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}
