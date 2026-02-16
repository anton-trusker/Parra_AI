import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PresenceUser {
  user_id: string;
  user_name: string;
  role: string;
  last_activity: string;
}

export function useInventoryPresence(sessionId: string) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`inventory:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as PresenceUser[];
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track current user presence
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              user_name: user.user_metadata?.name || user.email || 'Unknown',
              role: user.user_metadata?.role || 'staff',
              last_activity: new Date().toISOString()
            });
          }
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { activeUsers, isConnected };
}