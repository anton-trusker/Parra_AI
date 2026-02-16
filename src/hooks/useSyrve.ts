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
  testing_mode: boolean;
  settings: any;
  product_type_filters: string[] | null;
  field_mapping: any;
  auto_create_wines: boolean;
  auto_sync_enabled: boolean;
  sync_direction: string;
  import_inactive_products: boolean;
  reimport_mode: string;
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
      selected_store_ids?: string[];
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
      qc.invalidateQueries({ queryKey: ['measurement_units'] });
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
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMeasurementUnits() {
  return useQuery({
    queryKey: ['measurement_units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('*')
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

export function useLastSyncStats() {
  return useQuery({
    queryKey: ['last_sync_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_sync_runs')
        .select('*')
        .eq('status', 'success')
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SyrveSyncRun | null;
    },
  });
}

export function useProductCount() {
  return useQuery({
    queryKey: ['product_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useCategoryProductCounts() {
  return useQuery({
    queryKey: ['category_product_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true)
        .not('category_id', 'is', null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data || [])) {
        const cid = row.category_id as string;
        counts.set(cid, (counts.get(cid) || 0) + 1);
      }
      return counts;
    },
  });
}

export function useCleanAllSyrveData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Delete in dependency order
      await supabase.from('stock_levels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('product_barcodes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('measurement_units').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('syrve_raw_objects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('syrve_sync_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('syrve_api_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Reset syrve_config status
      const { data: config } = await supabase.from('syrve_config').select('id').limit(1).maybeSingle();
      if (config) {
        await supabase.from('syrve_config').update({
          connection_status: 'not_configured',
          selected_category_ids: null,
          selected_store_ids: null,
          default_store_id: null,
          default_store_name: null,
        } as any).eq('id', config.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_config'] });
      qc.invalidateQueries({ queryKey: ['syrve_stores'] });
      qc.invalidateQueries({ queryKey: ['syrve_categories'] });
      qc.invalidateQueries({ queryKey: ['syrve_products'] });
      qc.invalidateQueries({ queryKey: ['product_count'] });
      qc.invalidateQueries({ queryKey: ['category_product_counts'] });
      qc.invalidateQueries({ queryKey: ['last_sync_stats'] });
      qc.invalidateQueries({ queryKey: ['measurement_units'] });
      qc.invalidateQueries({ queryKey: ['syrve_sync_runs'] });
    },
  });
}

export interface SyrveApiLog {
  id: string;
  action_type: string;
  status: string;
  request_url: string | null;
  request_method: string | null;
  error_message: string | null;
  duration_ms: number | null;
  response_payload_preview: string | null;
  sync_run_id: string | null;
  created_at: string;
}

export function useSyrveApiLogs(limit = 50) {
  return useQuery({
    queryKey: ['syrve_api_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syrve_api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SyrveApiLog[];
    },
    refetchInterval: 5000,
  });
}

export function useForceStopSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: config } = await supabase
        .from('syrve_config')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (config) {
        await supabase
          .from('syrve_config')
          .update({ sync_lock_until: null } as any)
          .eq('id', config.id);
      }
      const { data: runningRuns } = await supabase
        .from('syrve_sync_runs')
        .select('id')
        .eq('status', 'running');
      if (runningRuns) {
        for (const run of runningRuns) {
          await supabase
            .from('syrve_sync_runs')
            .update({
              status: 'failed',
              error: 'Manually stopped by user',
              finished_at: new Date().toISOString(),
            } as any)
            .eq('id', run.id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_config'] });
      qc.invalidateQueries({ queryKey: ['syrve_sync_runs'] });
    },
  });
}

export function useToggleTestingMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: config } = await supabase
        .from('syrve_config')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (!config) throw new Error('Syrve not configured');
      const { error } = await supabase
        .from('syrve_config')
        .update({ testing_mode: enabled } as any)
        .eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_config'] });
    },
  });
}
