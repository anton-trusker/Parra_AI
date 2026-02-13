import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SyrveConfig {
  id: string;
  server_url: string;
  api_login: string;
  api_password_hash: string | null;
  default_store_id: string | null;
  default_store_name: string | null;
  sync_interval_minutes: number;
  connection_status: string;
  connection_tested_at: string | null;
  sync_lock_until: string | null;
  settings: any;
}

export interface SyrveStore {
  id: string;
  syrve_store_id: string;
  name: string;
  code: string | null;
  store_type: string | null;
  is_active: boolean;
}

export interface SyrveSyncRun {
  id: string;
  run_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  stats: any;
  error: string | null;
}

export function useSyrveConfig() {
  return useQuery({
    queryKey: ['syrve_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_config' as any)
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SyrveConfig | null;
    },
  });
}

export function useSyrveStores() {
  return useQuery({
    queryKey: ['syrve_stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as SyrveStore[];
    },
  });
}

export function useSyrveSyncRuns() {
  return useQuery({
    queryKey: ['syrve_sync_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_sync_runs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as SyrveSyncRun[];
    },
    refetchInterval: 5000, // Poll during syncs
  });
}

export function useTestSyrveConnection() {
  return useMutation({
    mutationFn: async (params: { server_url: string; api_login: string; api_password: string }) => {
      const { data, error } = await supabase.functions.invoke('syrve-connect-test', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });
}

export function useSaveSyrveConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      server_url: string;
      api_login: string;
      api_password_hash: string;
      default_store_id?: string;
      default_store_name?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('syrve-save-config', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_config'] });
    },
  });
}

export function useSyrveSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (syncType: string = 'bootstrap') => {
      const { data, error } = await supabase.functions.invoke('syrve-sync', {
        body: { sync_type: syncType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_sync_runs'] });
      qc.invalidateQueries({ queryKey: ['syrve_stores'] });
      qc.invalidateQueries({ queryKey: ['syrve_products'] });
      qc.invalidateQueries({ queryKey: ['syrve_categories'] });
    },
  });
}

export function useSyrveProducts(search?: string) {
  return useQuery({
    queryKey: ['syrve_products', search],
    queryFn: async () => {
      let query = supabase
        .from('products' as any)
        .select('*, categories!products_category_id_fkey(name)')
        .eq('is_active', true)
        .order('name');
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSyrveCategories() {
  return useQuery({
    queryKey: ['syrve_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}
