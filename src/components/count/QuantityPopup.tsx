import { Plus, Minus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';

export interface QuantityWine {
  id: string;
  name: string;
  producer?: string | null;
  vintage?: number | null;
  volume: number; // ml
  imageUrl?: string;
}

interface QuantityPopupProps {
  wine: QuantityWine;
  compact?: boolean;
  onConfirm: (unopened: number, opened: number, notes: string) => void;
  onCancel: () => void;
}

function EditableNumber({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value)); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const n = parseInt(draft) || 0;
    onChange(Math.max(min, n));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
        className="w-16 h-10 text-3xl font-heading font-bold text-center bg-secondary border border-accent rounded-lg outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-16 h-10 text-3xl font-heading font-bold text-center cursor-text hover:bg-secondary/50 rounded-lg transition-colors"
    >
      {value}
    </button>
  );
}

function BottleCounter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex-1 text-center">
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <EditableNumber value={value} onChange={onChange} />
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function QuantityPopup({ wine, compact, onConfirm, onCancel }: QuantityPopupProps) {
  const [unopened, setUnopened] = useState(0);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(unopened, 0, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border flex items-start gap-3">
          {wine.imageUrl && (
            <img src={wine.imageUrl} alt={wine.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold truncate">{wine.name}</h3>
            {wine.producer && <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>}
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <BottleCounter label="Quantity" value={unopened} onChange={setUnopened} />
          </div>

          {!compact && (
            <div>
              <Label className="text-sm mb-1 block">Notes (optional)</Label>
              <Textarea
                placeholder="e.g., Damaged packaging..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary border-border text-sm h-16"
              />
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={unopened === 0 && !compact}
            className="w-full h-12 text-base font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            {compact ? `Save (${unopened})` : `Confirm (${unopened} units)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
