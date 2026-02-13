import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type WineTypeEnum = Database['public']['Enums']['wine_type_enum'];

export type Wine = Tables<'wines'> & {
  product_id?: string | null;
  syrve_product_id?: string | null;
  enrichment_source?: string | null;
  enrichment_status?: string | null;
  raw_source_name?: string | null;
};
export type WineInsert = TablesInsert<'wines'>;
export type WineUpdate = TablesUpdate<'wines'>;

export function useWines(filters?: { search?: string; type?: string[]; country?: string[]; region?: string[]; stockStatus?: string[] }) {
  return useQuery({
    queryKey: ['wines', filters],
    queryFn: async () => {
      let query = supabase
        .from('wines')
        .select('*')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name');

      if (filters?.type?.length) {
        const mapped = filters.type.map(t => t.toLowerCase().replace('é', 'e') as WineTypeEnum);
        query = query.in('wine_type', mapped);
      }
      if (filters?.country?.length) {
        query = query.in('country', filters.country);
      }
      if (filters?.region?.length) {
        query = query.in('region', filters.region);
      }
      if (filters?.stockStatus?.length) {
        const mapped = filters.stockStatus.map(s => {
          if (s === 'In Stock') return 'in_stock';
          if (s === 'Low Stock') return 'low_stock';
          return 'out_of_stock';
        });
        query = query.in('stock_status', mapped);
      }
      if (filters?.search) {
        const q = `%${filters.search}%`;
        query = query.or(`name.ilike.${q},producer.ilike.${q},region.ilike.${q},country.ilike.${q}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Wine[];
    },
  });
}

export function useWine(id: string | undefined) {
  return useQuery({
    queryKey: ['wine', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Wine;
    },
    enabled: !!id,
  });
}

export function useCreateWine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wine: WineInsert) => {
      const { data, error } = await supabase.from('wines').insert(wine).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines'] }),
  });
}

export function useUpdateWine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: WineUpdate }) => {
      const { data, error } = await supabase.from('wines').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['wines'] });
      qc.invalidateQueries({ queryKey: ['wine', id] });
    },
  });
}

export function useArchiveWine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wines').update({ is_archived: true, is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines'] }),
  });
}
