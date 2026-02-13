import { Plus, Minus, Check, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGlassDimensions } from '@/hooks/useGlassDimensions';
import { useLocations } from '@/hooks/useLocations';
import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  onConfirm: (unopened: number, opened: number, notes: string, locationId?: string, subLocationId?: string) => void;
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

function PartialBottleRow({
  index,
  value,
  maxLitres,
  glassDimensions,
  onChange,
}: {
  index: number;
  value: number;
  maxLitres: number;
  glassDimensions: { id: string; label: string; volumeLitres: number }[];
  onChange: (litres: number) => void;
}) {
  const btlFraction = maxLitres > 0 ? value / maxLitres : 0;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Bottle #{index + 1}</span>
        <span className="text-xs text-muted-foreground">
          {value > 0 ? `${value.toFixed(3)}L · ${btlFraction.toFixed(2)} btl` : 'not set'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {glassDimensions.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.volumeLitres)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              Math.abs(value - g.volumeLitres) < 0.0001
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-secondary hover:bg-accent/20 border-border'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QuantityPopup({ wine, compact, onConfirm, onCancel }: QuantityPopupProps) {
  // wine.producer may be null from DB
  const { data: glassDimensionsRaw = [] } = useGlassDimensions();
  const { data: locationsRaw = [] } = useLocations();
  // Map DB rows to the shape expected by the component
  const glassDimensions = glassDimensionsRaw.map(g => ({ id: g.id, label: g.label, volumeLitres: g.volume_litres }));
  const locations = locationsRaw.map(l => ({ ...l, subLocations: l.sub_locations }));
  const [unopened, setUnopened] = useState(0);
  const [openedCount, setOpenedCount] = useState(0);
  const [partialLitres, setPartialLitres] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [locationId, setLocationId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');

  const wineVolumeLitres = wine.volume / 1000;
  const selectedLocation = locations.find((l) => l.id === locationId);

  // Sync partialLitres array length with openedCount
  useEffect(() => {
    setPartialLitres((prev) => {
      if (prev.length < openedCount) return [...prev, ...Array(openedCount - prev.length).fill(0)];
      if (prev.length > openedCount) return prev.slice(0, openedCount);
      return prev;
    });
  }, [openedCount]);

  // Reset sub-location when location changes
  useEffect(() => { setSubLocationId(''); }, [locationId]);

  const sumPartials = partialLitres.reduce((a, b) => a + b, 0);
  const totalLitres = unopened * wineVolumeLitres + sumPartials;
  const totalBtl = unopened + (wineVolumeLitres > 0 ? sumPartials / wineVolumeLitres : 0);

  const updatePartial = (index: number, litres: number) => {
    setPartialLitres((prev) => prev.map((v, i) => (i === index ? litres : v)));
  };

  const handleConfirm = () => {
    const totalOpenedFraction = wineVolumeLitres > 0 ? sumPartials / wineVolumeLitres : 0;
    onConfirm(
      unopened,
      parseFloat(totalOpenedFraction.toFixed(3)),
      notes,
      locationId || undefined,
      subLocationId || undefined,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with wine image */}
        <div className="p-4 border-b border-border flex items-start gap-3">
          {wine.imageUrl && (
            <img
              src={wine.imageUrl}
              alt={wine.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold truncate">{wine.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wine.vintage || 'NV'} · {wine.volume}ml ({wineVolumeLitres}L)
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Counters row */}
          <div className="flex gap-4">
            <BottleCounter label="Unopened" value={unopened} onChange={setUnopened} />
            {!compact && <BottleCounter label="Opened" value={openedCount} onChange={setOpenedCount} />}
          </div>

          {/* Partial bottles */}
          {!compact && openedCount > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium block">Partial Bottles</Label>
              {partialLitres.map((val, i) => (
                <PartialBottleRow
                  key={i}
                  index={i}
                  value={val}
                  maxLitres={wineVolumeLitres}
                  glassDimensions={glassDimensions}
                  onChange={(l) => updatePartial(i, l)}
                />
              ))}
            </div>
          )}

          {/* Location selector */}
          {!compact && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location
              </Label>
              <div className="flex gap-2">
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLocation && selectedLocation.subLocations.length > 0 && (
                  <Select value={subLocationId} onValueChange={setSubLocationId}>
                    <SelectTrigger className="bg-secondary border-border flex-1">
                      <SelectValue placeholder="Sub-location" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLocation.subLocations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {!compact && (unopened > 0 || openedCount > 0) && (
            <div className="bg-secondary/30 rounded-lg p-3 flex justify-around text-center">
              <div>
                <span className="text-xs text-muted-foreground block">In Bottles</span>
                <span className="text-lg font-heading font-bold">{totalBtl.toFixed(2)} btl</span>
              </div>
              <div className="w-px bg-border" />
              <div>
                <span className="text-xs text-muted-foreground block">In Litres</span>
                <span className="text-lg font-heading font-bold">{totalLitres.toFixed(3)}L</span>
              </div>
            </div>
          )}

          {/* Notes */}
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
            onClick={handleConfirm}
            disabled={unopened + openedCount === 0 && !compact}
            className="w-full h-12 text-base font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            {compact
              ? `Save (${unopened})`
              : `Confirm (${totalBtl.toFixed(2)} btl / ${totalLitres.toFixed(3)}L)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
