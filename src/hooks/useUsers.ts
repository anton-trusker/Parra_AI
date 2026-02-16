import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
  business_id?: string;
}

export interface UserFilters {
  businessId?: string;
  role?: string;
  isActive?: boolean;
}

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_users', {
          p_business_id: filters?.businessId,
          p_role: filters?.role,
          p_is_active: filters?.isActive
        });
      
      if (error) throw error;
      return data as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters?.businessId, // Only fetch when business ID is provided
  });
}