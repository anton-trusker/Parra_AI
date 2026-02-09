import { useState, useEffect } from 'react';
import { Wine } from '@/data/mockWines';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ScanProgressDialogProps {
  open: boolean;
  onComplete: (wine: Wine | null, confidence: number) => void;
  simulatedWine: Wine | null;
}

type Stage = 'quality' | 'searching' | 'found' | 'not-found';

export default function ScanProgressDialog({ open, onComplete, simulatedWine }: ScanProgressDialogProps) {
  const [stage, setStage] = useState<Stage>('quality');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setStage('quality');
      setProgress(0);
      return;
    }

    // Simulate quality check
    const t1 = setTimeout(() => {
      setStage('searching');
      setProgress(20);
    }, 600);

    // Progress animation
    const t2 = setTimeout(() => setProgress(50), 1000);
    const t3 = setTimeout(() => setProgress(80), 1500);

    // Result
    const t4 = setTimeout(() => {
      if (simulatedWine) {
        setStage('found');
        setProgress(100);
      } else {
        setStage('not-found');
      }
    }, 2200);

    // Auto-complete
    const t5 = setTimeout(() => {
      if (simulatedWine) {
        onComplete(simulatedWine, 92 + Math.random() * 6);
      } else {
        onComplete(null, 0);
      }
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [open, simulatedWine, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      <div className="relative w-[280px] bg-card border border-border rounded-2xl p-6 text-center shadow-2xl">
        {stage === 'quality' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-accent animate-spin" />
            <p className="font-heading font-semibold">Checking image quality...</p>
          </>
        )}

        {stage === 'searching' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
            <p className="font-heading font-semibold mb-3">Recognising wine...</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Matching against database</p>
          </>
        )}

        {stage === 'found' && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--wine-success))' }} />
            <p className="font-heading font-semibold">Wine identified!</p>
            {simulatedWine && (
              <p className="text-sm text-muted-foreground mt-1 truncate">{simulatedWine.name}</p>
            )}
          </>
        )}

        {stage === 'not-found' && (
          <>
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="font-heading font-semibold">Not recognised</p>
            <p className="text-sm text-muted-foreground mt-1">Try again or use manual search</p>
          </>
        )}
      </div>
    </div>
  );
}
