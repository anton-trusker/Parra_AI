import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlassDimensionRow {
  id: string;
  label: string;
  volume_litres: number;
  is_active: boolean;
  created_at: string;
}

export function useGlassDimensions() {
  return useQuery({
    queryKey: ['glass_dimensions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glass_dimensions')
        .select('*')
        .eq('is_active', true)
        .order('volume_litres');
      if (error) throw error;
      return data as GlassDimensionRow[];
    },
  });
}

export function useAddGlassDimension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: { label: string; volume_litres: number }) => {
      const { error } = await supabase.from('glass_dimensions').insert(g);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['glass_dimensions'] }),
  });
}

export function useRemoveGlassDimension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('glass_dimensions').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['glass_dimensions'] }),
  });
}
