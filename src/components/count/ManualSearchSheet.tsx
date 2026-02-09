import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Wine, mockWines } from '@/data/mockWines';
import { useState } from 'react';

interface ManualSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (wine: Wine) => void;
}

export default function ManualSearchSheet({ open, onClose, onSelect }: ManualSearchSheetProps) {
  const [query, setQuery] = useState('');

  const results = query.length >= 2
    ? mockWines.filter(w => {
        const q = query.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.producer.toLowerCase().includes(q);
      })
    : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet from bottom */}
      <div className="relative mt-auto max-h-[85vh] flex flex-col bg-card border-t border-border rounded-t-2xl overflow-hidden">
        {/* Handle + Header */}
        <div className="p-4 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold">Search Wine</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Type wine name or producer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 bg-secondary border-border"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
          {results.map(wine => (
            <button
              key={wine.id}
              onClick={() => { onSelect(wine); setQuery(''); }}
              className="w-full wine-glass-effect rounded-lg p-3 text-left hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{wine.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {wine.vintage || 'NV'} · {wine.volume}ml · {wine.region}
                  </p>
                </div>
                <Plus className="w-5 h-5 text-accent flex-shrink-0" />
              </div>
            </button>
          ))}
          {query.length >= 2 && results.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No wines found</p>
          )}
          {query.length < 2 && (
            <p className="text-center text-muted-foreground py-8 text-sm">Type at least 2 characters to search</p>
          )}
        </div>
      </div>
    </div>
  );
}
