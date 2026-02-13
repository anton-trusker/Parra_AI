import { useNavigate } from 'react-router-dom';
import { Wine as WineIcon, Clock, CheckCircle2, BarChart3, ArrowRight, Scan, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryItem } from '@/hooks/useInventorySessions';

interface SessionSummaryProps {
  sessionId: string;
  sessionName: string;
  items: InventoryItem[];
  duration: number;
  onStartNew: () => void;
  onClose: () => void;
}

export default function SessionSummary({ sessionId, sessionName, items, duration, onStartNew, onClose }: SessionSummaryProps) {
  const navigate = useNavigate();

  const totalWines = items.length;
  const totalUnopened = items.reduce((s, i) => s + (i.counted_quantity_unopened || 0), 0);
  const totalOpened = items.reduce((s, i) => s + (i.counted_quantity_opened || 0), 0);
  const totalBottles = totalUnopened + totalOpened;

  const methodBreakdown = {
    barcode: items.filter(i => i.counting_method === 'barcode').length,
    image_ai: items.filter(i => i.counting_method === 'image_ai').length,
    manual: items.filter(i => i.counting_method === 'manual').length,
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="wine-gradient p-6 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-primary-foreground" />
          <h2 className="font-heading text-xl font-bold text-primary-foreground">Session Complete</h2>
          <p className="text-primary-foreground/70 text-sm mt-1">{sessionName}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <WineIcon className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="font-heading text-2xl font-bold">{totalWines}</p>
              <p className="text-xs text-muted-foreground">Wines Counted</p>
            </div>
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <BarChart3 className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="font-heading text-2xl font-bold">{totalBottles}</p>
              <p className="text-xs text-muted-foreground">Total Bottles</p>
            </div>
          </div>

          <div className="wine-glass-effect rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Unopened</span>
              <span className="font-semibold">{totalUnopened}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Opened</span>
              <span className="font-semibold">{totalOpened}</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-border/50">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</span>
              <span className="font-semibold">{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="wine-glass-effect rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">Recognition Methods</p>
            <div className="flex gap-3">
              {methodBreakdown.barcode > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Scan className="w-3.5 h-3.5 text-accent" />
                  <span>{methodBreakdown.barcode} barcode</span>
                </div>
              )}
              {methodBreakdown.image_ai > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>{methodBreakdown.image_ai} image</span>
                </div>
              )}
              {methodBreakdown.manual > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{methodBreakdown.manual} manual</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 space-y-2">
          <Button className="w-full wine-gradient text-primary-foreground hover:opacity-90" onClick={onStartNew}>
            <WineIcon className="w-4 h-4 mr-2" /> Start New Count
          </Button>
          <Button variant="outline" className="w-full border-border" onClick={() => navigate('/sessions')}>
            View Sessions <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
