import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAppSetting<T = any>(key: string, defaultValue: T) {
  return useQuery({
    queryKey: ['app_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value as T) ?? defaultValue;
    },
  });
}

export function useUpdateAppSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from('app_settings').update({ value }).eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['app_settings', key] });
    },
  });
}
