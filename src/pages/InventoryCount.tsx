import { useState } from 'react';
import { toast } from 'sonner';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';

type Phase = 'setup' | 'scanning';

export default function InventoryCount() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [countType, setCountType] = useState('full');
  const [sessionId] = useState(() => `S${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const [counted, setCounted] = useState(0);

  if (phase === 'setup') {
    return (
      <CountSetup
        countType={countType}
        onCountTypeChange={setCountType}
        onStart={() => setPhase('scanning')}
      />
    );
  }

  return (
    <CameraScanner
      sessionId={sessionId}
      counted={counted}
      onCount={() => setCounted(c => c + 1)}
      onEndSession={() => { setPhase('setup'); toast.info('Session ended'); }}
    />
  );
}
