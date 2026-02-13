import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, fetchAppUser } from '@/stores/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setUser, setLoading, setInitialized, initialized } = useAuthStore();

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(async () => {
            const appUser = await fetchAppUser(session.user.id, session.user.email || '');
            setUser(appUser);
            setLoading(false);
            setInitialized(true);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    // Then get existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchAppUser(session.user.id, session.user.email || '').then((appUser) => {
          setUser(appUser);
          setLoading(false);
          setInitialized(true);
        });
      } else {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
