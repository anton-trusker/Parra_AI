import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AiRecognitionAttempt {
  attempt_id: string;
  session_name?: string;
  product_name?: string;
  product_sku?: string;
  confidence_score: number;
  recognition_method: string;
  image_url?: string;
  created_at: string;
  user_name?: string;
  status: string;
}

export interface AiRecognitionFilters {
  businessId?: string;
  userId?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useAiRecognitionAttempts(filters?: AiRecognitionFilters) {
  return useQuery({
    queryKey: ['ai_recognition_attempts', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_ai_recognition_attempts', {
          p_business_id: filters?.businessId,
          p_user_id: filters?.userId,
          p_session_id: filters?.sessionId,
          p_start_date: filters?.startDate,
          p_end_date: filters?.endDate,
          p_limit: filters?.limit || 50
        });
      
      if (error) throw error;
      return data as AiRecognitionAttempt[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters?.businessId, // Only fetch when business ID is provided
  });
}