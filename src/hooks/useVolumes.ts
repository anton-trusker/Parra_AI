import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VolumeRow {
  id: string;
  label: string;
  ml: number;
  bottle_size: string | null;
  is_active: boolean;
}

export function useVolumes() {
  return useQuery({
    queryKey: ['volume_options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volume_options')
        .select('*')
        .eq('is_active', true)
        .order('ml');
      if (error) throw error;
      return data as VolumeRow[];
    },
  });
}

export function useAddVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { label: string; ml: number; bottle_size?: string }) => {
      const { error } = await supabase.from('volume_options').insert(v);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volume_options'] }),
  });
}

export function useRemoveVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('volume_options').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volume_options'] }),
  });
}
