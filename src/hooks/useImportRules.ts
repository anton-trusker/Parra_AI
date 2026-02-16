import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportRule {
  id: string;
  business_id: string;
  rule_type: 'category_filter' | 'product_type_filter' | 'price_range' | 'custom_condition';
  name: string;
  description?: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportRuleFilters {
  businessId?: string;
  isActive?: boolean;
}

export function useImportRules(filters?: ImportRuleFilters) {
  return useQuery({
    queryKey: ['import_rules', filters],
    queryFn: async () => {
      let query = supabase
        .from('import_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (filters?.businessId) {
        query = query.eq('business_id', filters.businessId);
      }
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ImportRule[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters?.businessId, // Only fetch when business ID is provided
  });
}

export function useCreateImportRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: Omit<ImportRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('import_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data as ImportRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import_rules'] });
    },
  });
}

export function useUpdateImportRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ImportRule> }) => {
      const { data, error } = await supabase
        .from('import_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ImportRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import_rules'] });
    },
  });
}

export function useDeleteImportRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('import_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import_rules'] });
    },
  });
}