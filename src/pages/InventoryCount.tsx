import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';
import SessionSummary from '@/components/count/SessionSummary';
import { useAuthStore } from '@/stores/authStore';
import { useCreateSession, useCompleteSession, useSessionItems } from '@/hooks/useInventorySessions';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Monitor } from 'lucide-react';

type Phase = 'setup' | 'scanning' | 'summary';

export default function InventoryCount() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>('setup');
  const [countType, setCountType] = useState('full');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [counted, setCounted] = useState(0);
  const [startTime] = useState(() => Date.now());

  const createSession = useCreateSession();
  const completeSession = useCompleteSession();
  const { data: sessionItems = [] } = useSessionItems(sessionId ?? undefined);
  const { data: hideScannerDesktop = false } = useAppSetting<boolean>('inventory_hide_scanner_desktop', false);

  const { data: activeSession } = useQuery({
    queryKey: ['active_inventory_session'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_sessions')
        .select('*')
        .eq('status', 'in_progress' as any)
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  const handleStart = useCallback(async () => {
    if (!user) return;
    try {
      const session = await createSession.mutateAsync({
        session_name: `${countType === 'full' ? 'Full' : countType === 'partial' ? 'Partial' : 'Spot'} Count`,
        session_type: countType,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        started_by: user.id,
        description: notes || null,
      });
      setSessionId(session.id);
      setPhase('scanning');
    } catch (e: any) {
      toast.error('Failed to create session: ' + e.message);
    }
  }, [user, countType, notes, createSession]);

  const handleJoinSession = useCallback(() => {
    if (activeSession) {
      setSessionId(activeSession.id);
      setPhase('scanning');
      toast.success('Joined active session');
    }
  }, [activeSession]);

  const handleCount = useCallback(() => {
    setCounted(c => c + 1);
  }, []);

  const handleEndSession = useCallback(async () => {
    if (counted === 0) {
      setPhase('setup');
      toast.info('Session cancelled');
      return;
    }
    if (!sessionId || !user) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await completeSession.mutateAsync({
        id: sessionId,
        completedBy: user.id,
        duration,
        totalCounted: counted,
      });
      setPhase('summary');
    } catch (e: any) {
      toast.error('Failed to complete session: ' + e.message);
    }
  }, [counted, sessionId, user, startTime, completeSession]);

  // Desktop scanner hidden check (after all hooks)
  if (!isMobile && hideScannerDesktop) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4 animate-fade-in">
        <Monitor className="w-16 h-16 mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-heading font-bold">Desktop Scanning Disabled</h2>
        <p className="text-muted-foreground">
          Scanning is configured to be available on mobile devices only. Open this page on a mobile device to start counting.
        </p>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <CountSetup
        countType={countType}
        onCountTypeChange={setCountType}
        notes={notes}
        onNotesChange={setNotes}
        onStart={handleStart}
        isLoading={createSession.isPending}
        activeSession={activeSession}
        onJoinSession={handleJoinSession}
      />
    );
  }

  if (phase === 'summary' && sessionId) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    return (
      <SessionSummary
        sessionId={sessionId}
        sessionName={`${countType === 'full' ? 'Full' : countType === 'partial' ? 'Partial' : 'Spot'} Count`}
        items={sessionItems}
        duration={duration}
        onStartNew={() => { setCounted(0); setSessionId(null); setPhase('setup'); }}
        onClose={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <CameraScanner
      sessionId={sessionId!}
      counted={counted}
      onCount={handleCount}
      onEndSession={handleEndSession}
    />
  );
}
