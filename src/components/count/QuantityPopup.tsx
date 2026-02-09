import { Plus, Minus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wine } from '@/data/mockWines';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState } from 'react';

interface QuantityPopupProps {
  wine: Wine;
  compact?: boolean;
  onConfirm: (unopened: number, opened: number, notes: string) => void;
  onCancel: () => void;
}

export default function QuantityPopup({ wine, compact, onConfirm, onCancel }: QuantityPopupProps) {
  const { openedBottleUnit, glassDimensions } = useSettingsStore();
  const [unopened, setUnopened] = useState(0);
  const [openedValue, setOpenedValue] = useState(0); // whole opened bottles
  const [partialValue, setPartialValue] = useState(''); // partial amount as string for precision
  const [partialMode, setPartialMode] = useState<'manual' | 'glass'>('manual');
  const [notes, setNotes] = useState('');

  const wineVolumeLitres = wine.volume / 1000;

  // Calculate total opened: whole bottles + partial
  const partialNum = parseFloat(partialValue) || 0;
  const totalOpened = openedBottleUnit === 'litres'
    ? openedValue + (partialNum / wineVolumeLitres) // convert litres to bottle fraction
    : openedValue + partialNum; // fraction of bottle

  const displayTotal = unopened + Math.ceil(totalOpened);

  const handleGlassSelect = (volumeLitres: number) => {
    const current = parseFloat(partialValue) || 0;
    if (openedBottleUnit === 'litres') {
      setPartialValue((current + volumeLitres).toFixed(3));
    } else {
      // Convert glass to bottle fraction
      const fraction = volumeLitres / wineVolumeLitres;
      setPartialValue((current + fraction).toFixed(3));
    }
  };

  const handleConfirm = () => {
    const openedTotal = openedBottleUnit === 'litres'
      ? openedValue + (partialNum / wineVolumeLitres)
      : openedValue + partialNum;
    onConfirm(unopened, parseFloat(openedTotal.toFixed(3)), notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Wine info header */}
        <div className="p-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold truncate">{wine.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wine.vintage || 'NV'} · {wine.volume}ml ({wineVolumeLitres}L) · {wine.region}
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Unopened counter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Unopened Bottles</Label>
            <div className="flex items-center justify-center gap-5">
              <button onClick={() => setUnopened(Math.max(0, unopened - 1))}
                className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-4xl font-heading font-bold w-16 text-center">{unopened}</span>
              <button onClick={() => setUnopened(unopened + 1)}
                className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Opened counter - always show for full mode */}
          {!compact && (
            <>
              {/* Whole opened bottles */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Opened Bottles (whole)</Label>
                <div className="flex items-center justify-center gap-5">
                  <button onClick={() => setOpenedValue(Math.max(0, openedValue - 1))}
                    className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-4xl font-heading font-bold w-16 text-center">{openedValue}</span>
                  <button onClick={() => setOpenedValue(openedValue + 1)}
                    className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Partial bottle amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium block">
                  Partial Bottle {openedBottleUnit === 'litres' ? '(litres)' : '(fraction of bottle)'}
                </Label>

                <div className="flex gap-2 items-center">
                  <div className="flex items-center bg-secondary rounded-full p-0.5 gap-0.5">
                    <button onClick={() => setPartialMode('manual')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${partialMode === 'manual' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
                      Manual
                    </button>
                    <button onClick={() => setPartialMode('glass')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${partialMode === 'glass' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
                      By Glass
                    </button>
                  </div>
                </div>

                {partialMode === 'manual' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      max={openedBottleUnit === 'litres' ? wineVolumeLitres.toString() : '1'}
                      value={partialValue}
                      onChange={e => setPartialValue(e.target.value)}
                      placeholder={openedBottleUnit === 'litres' ? 'e.g. 0.250' : 'e.g. 0.3'}
                      className="bg-secondary border-border w-28"
                    />
                    <span className="text-sm text-muted-foreground">
                      {openedBottleUnit === 'litres' ? 'L' : 'of bottle'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {glassDimensions.map(g => (
                      <button key={g.id} onClick={() => handleGlassSelect(g.volumeLitres)}
                        className="px-3 py-2 rounded-lg bg-secondary hover:bg-accent/20 border border-border text-sm font-medium transition-colors">
                        {g.label}
                      </button>
                    ))}
                  </div>
                )}

                {partialValue && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                    <span>Partial: {partialValue} {openedBottleUnit === 'litres' ? 'L' : 'of bottle'}</span>
                    <button onClick={() => setPartialValue('')} className="text-destructive hover:underline">Clear</button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Total litres calculation */}
          {!compact && (
            <div className="bg-secondary/30 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unopened</span>
                <span>{unopened} × {wineVolumeLitres}L = <strong>{(unopened * wineVolumeLitres).toFixed(3)}L</strong></span>
              </div>
              {(openedValue > 0 || partialNum > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opened</span>
                  <span>
                    {openedBottleUnit === 'litres'
                      ? <strong>{(openedValue * wineVolumeLitres + partialNum).toFixed(3)}L</strong>
                      : <strong>{(totalOpened * wineVolumeLitres).toFixed(3)}L</strong>
                    }
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>Total</span>
                <span>{((unopened + totalOpened) * wineVolumeLitres).toFixed(3)}L</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {!compact && (
            <div>
              <Label className="text-sm mb-1 block">Notes (optional)</Label>
              <Textarea placeholder="e.g., Damaged label..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-secondary border-border text-sm h-16" />
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={unopened + openedValue === 0 && !partialValue && !compact}
            className="w-full h-12 text-base font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            {compact
              ? `Save (${unopened})`
              : `Confirm (${unopened} sealed + ${totalOpened.toFixed(2)} opened)`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
