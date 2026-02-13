import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type WineVariant = Tables<'wine_variants'>;

export function useWineVariants(wineId: string | undefined) {
  return useQuery({
    queryKey: ['wine-variants', wineId],
    queryFn: async () => {
      if (!wineId) return [];
      const { data, error } = await supabase
        .from('wine_variants')
        .select('*')
        .eq('base_wine_id', wineId)
        .eq('is_active', true)
        .order('vintage', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as WineVariant[];
    },
    enabled: !!wineId,
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variant: TablesInsert<'wine_variants'>) => {
      const { data, error } = await supabase.from('wine_variants').insert(variant).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['wine-variants', data.base_wine_id] });
    },
  });
}

export function useUpdateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'wine_variants'> }) => {
      const { data, error } = await supabase.from('wine_variants').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['wine-variants', data.base_wine_id] });
    },
  });
}
