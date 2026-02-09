import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';
import SessionSummary from '@/components/count/SessionSummary';
import { InventoryItem } from '@/data/mockWines';

type Phase = 'setup' | 'scanning' | 'summary';

export default function InventoryCount() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('setup');
  const [countType, setCountType] = useState('full');
  const [sessionId] = useState(() => `S${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const [counted, setCounted] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [sessionItems, setSessionItems] = useState<InventoryItem[]>([]);

  const handleCount = useCallback(() => {
    setCounted(c => c + 1);
  }, []);

  const handleEndSession = useCallback(() => {
    if (counted === 0) {
      setPhase('setup');
      toast.info('Session cancelled');
      return;
    }
    setPhase('summary');
  }, [counted]);

  if (phase === 'setup') {
    return (
      <CountSetup
        countType={countType}
        onCountTypeChange={setCountType}
        onStart={() => setPhase('scanning')}
      />
    );
  }

  if (phase === 'summary') {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    // Generate mock summary items from counted items
    const mockItems: InventoryItem[] = Array.from({ length: counted }, (_, i) => ({
      id: `temp-${i}`,
      sessionId,
      wineId: String(i + 1),
      wineName: `Wine ${i + 1}`,
      expectedUnopened: 10,
      expectedOpened: 1,
      countedUnopened: 10 + (i % 3 === 0 ? -1 : 0),
      countedOpened: 1,
      varianceUnopened: i % 3 === 0 ? -1 : 0,
      varianceOpened: 0,
      totalVariance: i % 3 === 0 ? -1 : 0,
      hasVariance: i % 3 === 0,
      countedAt: new Date().toISOString(),
      countedBy: '2',
      countedByName: 'Current User',
      countingMethod: i % 2 === 0 ? 'barcode' : 'manual',
    }));

    return (
      <SessionSummary
        sessionId={sessionId}
        sessionName={`${countType === 'full' ? 'Full' : countType === 'partial' ? 'Partial' : 'Spot'} Count`}
        items={mockItems}
        duration={duration}
        onStartNew={() => { setCounted(0); setPhase('setup'); }}
        onClose={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <CameraScanner
      sessionId={sessionId}
      counted={counted}
      onCount={handleCount}
      onEndSession={handleEndSession}
    />
  );
}
