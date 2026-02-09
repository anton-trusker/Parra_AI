import { Plus, Minus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wine } from '@/data/mockWines';
import { useState } from 'react';

interface QuantityPopupProps {
  wine: Wine;
  compact?: boolean; // barcode mode = compact, image/manual = full
  onConfirm: (unopened: number, opened: number, notes: string) => void;
  onCancel: () => void;
}

export default function QuantityPopup({ wine, compact, onConfirm, onCancel }: QuantityPopupProps) {
  const [unopened, setUnopened] = useState(0);
  const [opened, setOpened] = useState(0);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Wine info header */}
        <div className="p-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold truncate">{wine.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wine.vintage || 'NV'} · {wine.volume}ml · {wine.region}
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Unopened counter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Unopened</Label>
            <div className="flex items-center justify-center gap-5">
              <button
                onClick={() => setUnopened(Math.max(0, unopened - 1))}
                className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-4xl font-heading font-bold w-16 text-center">{unopened}</span>
              <button
                onClick={() => setUnopened(unopened + 1)}
                className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Opened counter */}
          {!compact && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Opened (Partial)</Label>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setOpened(Math.max(0, opened - 1))}
                  className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-4xl font-heading font-bold w-16 text-center">{opened}</span>
                <button
                  onClick={() => setOpened(opened + 1)}
                  className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Notes - only in non-compact */}
          {!compact && (
            <div>
              <Label className="text-sm mb-1 block">Notes (optional)</Label>
              <Textarea
                placeholder="e.g., Damaged label..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary border-border text-sm h-16"
              />
            </div>
          )}

          <Button
            onClick={() => onConfirm(unopened, compact ? 0 : opened, notes)}
            disabled={unopened + opened === 0 && !compact}
            className="w-full h-12 text-base font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            {compact ? `Save (${unopened})` : `Confirm (${unopened + opened} bottles)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
