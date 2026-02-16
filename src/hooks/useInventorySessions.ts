import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InventorySession {
  id: string;
  name: string;
  store_id: string;
  store_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name?: string;
  total_items?: number;
  total_variance?: number;
  completed_items?: number;
  business_id?: string;
}

export interface InventoryItem {
  id: string;
  session_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  category_name?: string;
  baseline_quantity: number;
  counted_quantity: number;
  variance: number;
  variance_percentage?: number;
  status: string;
  last_counted_by?: string;
  last_counted_at?: string;
  store_name?: string;
  notes?: string;
}

export interface SessionFilters {
  businessId?: string;
  storeIds?: string[];
  status?: string[];
  startDate?: string;
  endDate?: string;
}

export function useInventorySessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: ['inventory_sessions', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_inventory_sessions', {
          p_business_id: filters?.businessId,
          p_store_ids: filters?.storeIds,
          p_status: filters?.status,
          p_start_date: filters?.startDate,
          p_end_date: filters?.endDate
        });
      
      if (error) throw error;
      return data as InventorySession[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters?.businessId, // Only fetch when business ID is provided
  });
}

export function useSessionItems(sessionId: string) {
  return useQuery({
    queryKey: ['inventory_session_items', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_inventory_session_items', {
          p_session_id: sessionId
        });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!sessionId, // Only fetch when session ID is provided
  });
}

export function useUpsertInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      productId: string;
      countedQuantity: number;
      userId: string;
      notes?: string;
    }) => {
      const response = await supabase.functions.invoke('inventory-upsert-item', {
        body: params
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_session_items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      name: string;
      storeId: string;
      businessId: string;
      createdBy: string;
    }) => {
      const response = await supabase.functions.invoke('inventory-create-session', {
        body: params
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}

export function useApproveSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, approvedBy }: { sessionId: string; approvedBy: string }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update({ 
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}

export function useFlagSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, flaggedBy, reason }: { sessionId: string; flaggedBy: string; reason: string }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update({ 
          status: 'flagged',
          flagged_by: flaggedBy,
          flagged_at: new Date().toISOString(),
          flagged_reason: reason
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await supabase.functions.invoke('inventory-submit-to-syrve', {
        body: { sessionId }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_sessions'] });
    },
  });
}