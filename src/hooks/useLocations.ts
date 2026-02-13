import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LocationRow {
  id: string;
  name: string;
  type: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SubLocationRow {
  id: string;
  location_id: string;
  name: string;
  is_active: boolean;
}

export interface LocationWithSubs extends LocationRow {
  sub_locations: SubLocationRow[];
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const [locsRes, subsRes] = await Promise.all([
        supabase.from('locations').select('*').eq('is_active', true).order('name'),
        supabase.from('sub_locations').select('*').eq('is_active', true).order('name'),
      ]);
      if (locsRes.error) throw locsRes.error;
      if (subsRes.error) throw subsRes.error;
      const subs = subsRes.data as SubLocationRow[];
      return (locsRes.data as LocationRow[]).map(l => ({
        ...l,
        sub_locations: subs.filter(s => s.location_id === l.id),
      })) as LocationWithSubs[];
    },
  });
}

export function useAddLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loc: { name: string; type?: string }) => {
      const { error } = await supabase.from('locations').insert(loc);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useRemoveLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useAddSubLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: { location_id: string; name: string }) => {
      const { error } = await supabase.from('sub_locations').insert(sub);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useRemoveSubLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sub_locations').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}
