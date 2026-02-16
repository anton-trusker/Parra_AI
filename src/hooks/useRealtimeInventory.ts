import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeInventory(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`inventory_updates:${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'inventory_items', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          // Invalidate inventory items query to refetch latest data
          queryClient.invalidateQueries({ queryKey: ['inventory_session_items', sessionId] });
          
          // Also invalidate the session list to update counts
          queryClient.invalidateQueries({ queryKey: ['inventory_sessions'] });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ai_recognition_attempts', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          // Invalidate AI recognition attempts
          queryClient.invalidateQueries({ queryKey: ['ai_recognition_attempts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);
}