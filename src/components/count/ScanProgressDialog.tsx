import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Search, Wine } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface WineRef {
  id: string;
  name: string;
  producer?: string;
  vintage?: number | null;
  volume?: number;
  volumeLabel?: string;
  [key: string]: any;
}

interface ScanProgressDialogProps {
  open: boolean;
  aiResult: any | null; // null = still loading
  onComplete: (wine: WineRef | null, confidence: number) => void;
  onManualSearch: () => void;
  onSelectVariant?: (variant: any) => void;
}

type Stage = 'analyzing' | 'found' | 'variants' | 'not-found' | 'error';

export default function ScanProgressDialog({ open, aiResult, onComplete, onManualSearch, onSelectVariant }: ScanProgressDialogProps) {
  const [stage, setStage] = useState<Stage>('analyzing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setStage('analyzing');
      setProgress(0);
      return;
    }

    // Animate progress while waiting for result
    if (!aiResult) {
      setStage('analyzing');
      const t1 = setTimeout(() => setProgress(20), 300);
      const t2 = setTimeout(() => setProgress(40), 800);
      const t3 = setTimeout(() => setProgress(60), 1500);
      const t4 = setTimeout(() => setProgress(75), 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }

    // Result arrived
    setProgress(100);

    if (aiResult.status === 'success' && aiResult.match) {
      setStage('found');
      // Auto-complete after brief display
      const t = setTimeout(() => {
        onComplete({
          id: aiResult.match.id,
          name: aiResult.match.name,
          producer: aiResult.match.producer || '',
          vintage: aiResult.match.vintage,
          volume: aiResult.match.volume_ml || 750,
          volumeLabel: aiResult.match.volume_label,
        }, aiResult.confidence);
      }, 1200);
      return () => clearTimeout(t);
    }

    if (aiResult.status === 'select_variant' && aiResult.variants?.length > 0) {
      setStage('variants');
      return;
    }

    if (aiResult.status === 'manual_review' && aiResult.match) {
      setStage('found');
      return; // User must confirm manually
    }

    if (aiResult.error || aiResult.status === 'failed') {
      setStage('error');
      return;
    }

    setStage('not-found');
  }, [open, aiResult, onComplete]);

  if (!open) return null;

  const handleConfirmMatch = () => {
    if (aiResult?.match) {
      onComplete({
        id: aiResult.match.id,
        name: aiResult.match.name,
        producer: aiResult.match.producer || '',
        vintage: aiResult.match.vintage,
        volume: aiResult.match.volume_ml || 750,
        volumeLabel: aiResult.match.volume_label,
      }, aiResult.confidence);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative w-[320px] bg-card border border-border rounded-2xl p-6 text-center shadow-2xl">
        {stage === 'analyzing' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
            <p className="font-heading font-semibold mb-3">Analysing wine label...</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">AI recognition in progress</p>
          </>
        )}

        {stage === 'found' && aiResult?.match && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--wine-success, 142 71% 45%))' }} />
            <p className="font-heading font-semibold">Wine identified!</p>
            <p className="text-sm text-muted-foreground mt-1 truncate">{aiResult.match.name}</p>
            {aiResult.match.producer && (
              <p className="text-xs text-muted-foreground truncate">{aiResult.match.producer}</p>
            )}
            {aiResult.match.vintage && (
              <p className="text-xs text-muted-foreground">{aiResult.match.vintage}</p>
            )}
            <p className="text-xs text-primary mt-2">
              Confidence: {aiResult.confidence?.toFixed(0)}%
            </p>
            {aiResult.status === 'manual_review' && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1" onClick={onManualSearch}>
                  <Search className="w-3.5 h-3.5 mr-1" /> Wrong
                </Button>
                <Button size="sm" className="flex-1" onClick={handleConfirmMatch}>
                  Confirm
                </Button>
              </div>
            )}
          </>
        )}

        {stage === 'variants' && aiResult?.variants && (
          <>
            <Wine className="w-10 h-10 mx-auto mb-3 text-primary" />
            <p className="font-heading font-semibold mb-1">Wine found — select vintage</p>
            {aiResult.extracted?.product_name && (
              <p className="text-sm text-muted-foreground mb-3 truncate">{aiResult.extracted.product_name}</p>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aiResult.variants.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVariant?.(v)}
                  className="w-full p-2.5 rounded-lg border border-border hover:border-primary/50 text-left transition-colors"
                >
                  <p className="font-medium text-sm">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.vintage || 'NV'} · {v.volume_ml || 750}ml</p>
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={onManualSearch}>
              <Search className="w-3.5 h-3.5 mr-1" /> Manual Search
            </Button>
          </>
        )}

        {stage === 'not-found' && (
          <>
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="font-heading font-semibold">Not recognised</p>
            {aiResult?.extracted?.product_name && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                Detected: {aiResult.extracted.product_name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">No matching wine in catalog</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onComplete(null, 0)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={onManualSearch}>
                <Search className="w-3.5 h-3.5 mr-1" /> Search
              </Button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="font-heading font-semibold">Recognition failed</p>
            <p className="text-sm text-muted-foreground mt-1">{aiResult?.error || 'An error occurred'}</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onComplete(null, 0)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={onManualSearch}>
                <Search className="w-3.5 h-3.5 mr-1" /> Manual
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
