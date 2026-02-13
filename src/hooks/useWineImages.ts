import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type WineImage = Tables<'wine_images'>;

export function useWineImages(wineId: string | undefined) {
  return useQuery({
    queryKey: ['wine-images', wineId],
    queryFn: async () => {
      if (!wineId) return [];
      const { data, error } = await supabase
        .from('wine_images')
        .select('*')
        .eq('wine_id', wineId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as WineImage[];
    },
    enabled: !!wineId,
  });
}

export function useUploadWineImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ wineId, file, isPrimary = false }: { wineId: string; file: File; isPrimary?: boolean }) => {
      const ext = file.name.split('.').pop();
      const path = `${wineId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('wine-images')
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('wine-images').getPublicUrl(path);

      // If setting as primary, unset other primaries
      if (isPrimary) {
        await supabase.from('wine_images').update({ is_primary: false }).eq('wine_id', wineId);
      }

      const { data, error } = await supabase.from('wine_images').insert({
        wine_id: wineId,
        image_url: urlData.publicUrl,
        storage_key: path,
        filename: file.name,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        is_primary: isPrimary,
        source: 'upload',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { wineId }) => {
      qc.invalidateQueries({ queryKey: ['wine-images', wineId] });
    },
  });
}

export function useSetPrimaryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, wineId }: { imageId: string; wineId: string }) => {
      await supabase.from('wine_images').update({ is_primary: false }).eq('wine_id', wineId);
      const { error } = await supabase.from('wine_images').update({ is_primary: true }).eq('id', imageId);
      if (error) throw error;
    },
    onSuccess: (_, { wineId }) => {
      qc.invalidateQueries({ queryKey: ['wine-images', wineId] });
    },
  });
}

export function useDeleteWineImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, storageKey, wineId }: { imageId: string; storageKey: string | null; wineId: string }) => {
      if (storageKey) {
        await supabase.storage.from('wine-images').remove([storageKey]);
      }
      const { error } = await supabase.from('wine_images').delete().eq('id', imageId);
      if (error) throw error;
      return wineId;
    },
    onSuccess: (wineId) => {
      qc.invalidateQueries({ queryKey: ['wine-images', wineId] });
    },
  });
}
