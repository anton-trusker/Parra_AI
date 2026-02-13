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
  selected_category_ids: string[] | null;
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

export interface SyrveOutboxJob {
  id: string;
  job_type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  session_id: string | null;
  created_at: string;
}

export function useSyrveConfig() {
  return useQuery({
    queryKey: ['syrve_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SyrveConfig | null;
    },
  });
}

export function useSyrveStores() {
  return useQuery({
    queryKey: ['syrve_stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as SyrveStore[];
    },
  });
}

export function useSyrveSyncRuns() {
  return useQuery({
    queryKey: ['syrve_sync_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_sync_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SyrveSyncRun[];
    },
    refetchInterval: 5000,
  });
}

export function useSyrveOutboxJobs() {
  return useQuery({
    queryKey: ['syrve_outbox_jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_outbox_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SyrveOutboxJob[];
    },
    refetchInterval: 10000,
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
      selected_category_ids?: string[];
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

export function useProcessOutbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId?: string) => {
      const { data, error } = await supabase.functions.invoke('syrve-process-outbox', {
        body: jobId ? { job_id: jobId } : {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_outbox_jobs'] });
      qc.invalidateQueries({ queryKey: ['syrve_sync_runs'] });
    },
  });
}

export function useSyrveProducts(search?: string) {
  return useQuery({
    queryKey: ['syrve_products', search],
    queryFn: async () => {
      let query = supabase
        .from('products')
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
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSyrveBarcodeCount() {
  return useQuery({
    queryKey: ['syrve_barcode_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('product_barcodes')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });
}
