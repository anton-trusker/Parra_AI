import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';
import SessionSummary from '@/components/count/SessionSummary';
import { useAuthStore } from '@/stores/authStore';
import { useCreateSession, useCompleteSession, useSessionItems } from '@/hooks/useInventorySessions';

type Phase = 'setup' | 'scanning' | 'summary';

export default function InventoryCount() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [phase, setPhase] = useState<Phase>('setup');
  const [countType, setCountType] = useState('full');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [counted, setCounted] = useState(0);
  const [startTime] = useState(() => Date.now());

  const createSession = useCreateSession();
  const completeSession = useCompleteSession();
  const { data: sessionItems = [] } = useSessionItems(sessionId ?? undefined);

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

  if (phase === 'setup') {
    return (
      <CountSetup
        countType={countType}
        onCountTypeChange={setCountType}
        notes={notes}
        onNotesChange={setNotes}
        onStart={handleStart}
        isLoading={createSession.isPending}
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
