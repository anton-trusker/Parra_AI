import { useState, useCallback, useRef, useEffect } from 'react';
import { Scan, Camera, Search, StopCircle, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ManualSearchSheet from './ManualSearchSheet';
import QuantityPopup from './QuantityPopup';
import ScanProgressDialog from './ScanProgressDialog';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useUpsertInventoryItem } from '@/hooks/useInventorySessions';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';

type ScanMode = 'barcode' | 'image';

interface WineRef {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  volume: number;
  volumeLabel?: string;
  imageUrl?: string;
  barcode?: string;
}

interface CameraScannerProps {
  sessionId: string;
  counted: number;
  onCount: () => void;
  onEndSession: () => void;
}

const SCANNER_ELEMENT_ID = 'barcode-scanner-region';

export default function CameraScanner({ sessionId, counted, onCount, onEndSession }: CameraScannerProps) {
  const { user } = useAuthStore();
  const upsertItem = useUpsertInventoryItem();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [selectedWine, setSelectedWine] = useState<WineRef | null>(null);
  const [showQuantity, setShowQuantity] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressWine, setProgressWine] = useState<WineRef | null>(null);
  const [isCompactQuantity, setIsCompactQuantity] = useState(false);
  const [countingMethod, setCountingMethod] = useState<'barcode' | 'manual' | 'image_ai'>('barcode');
  const imageVideoRef = useRef<HTMLVideoElement>(null);
  const sharedStreamRef = useRef<MediaStream | null>(null);

  // Acquire camera once on mount
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        sharedStreamRef.current = stream;
        if (imageVideoRef.current) imageVideoRef.current.srcObject = stream;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sharedStreamRef.current?.getTracks().forEach(t => t.stop());
      sharedStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mode === 'image' && imageVideoRef.current && sharedStreamRef.current) {
      imageVideoRef.current.srcObject = sharedStreamRef.current;
    }
  }, [mode]);

  // Barcode detection — look up wine by barcode from DB
  const handleBarcodeDetected = useCallback(async (code: string) => {
    const { data: barcodeRow } = await supabase
      .from('wine_barcodes')
      .select('wine_id')
      .eq('barcode', code)
      .eq('is_active', true)
      .maybeSingle();

    if (!barcodeRow) {
      // Also try primary_barcode on wines table
      const { data: wineRow } = await supabase
        .from('wines')
        .select('id, name, producer, vintage, volume_ml, volume_label')
        .eq('primary_barcode', code)
        .maybeSingle();

      if (wineRow) {
        const w: WineRef = {
          id: wineRow.id,
          name: wineRow.name,
          producer: wineRow.producer || '',
          vintage: wineRow.vintage,
          volume: wineRow.volume_ml || 750,
          volumeLabel: wineRow.volume_label || undefined,
        };
        toast.success(`Barcode matched: ${w.name}`, { duration: 1500 });
        setSelectedWine(w);
        setCountingMethod('barcode');
        setIsCompactQuantity(true);
        setShowQuantity(true);
        return;
      }

      toast.info(`Barcode scanned: ${code}`, { description: 'Wine not found. Try manual search.', duration: 3000 });
      return;
    }

    const { data: wine } = await supabase
      .from('wines')
      .select('id, name, producer, vintage, volume_ml, volume_label')
      .eq('id', barcodeRow.wine_id)
      .single();

    if (wine) {
      const w: WineRef = {
        id: wine.id,
        name: wine.name,
        producer: wine.producer || '',
        vintage: wine.vintage,
        volume: wine.volume_ml || 750,
        volumeLabel: wine.volume_label || undefined,
      };
      toast.success(`Barcode matched: ${w.name}`, { duration: 1500 });
      setSelectedWine(w);
      setCountingMethod('barcode');
      setIsCompactQuantity(true);
      setShowQuantity(true);
    }
  }, []);

  const isBarcodeActive = mode === 'barcode' && !showQuantity && !showManualSearch && !showProgress;
  const { isScanning, error: scannerError } = useBarcodeScanner(SCANNER_ELEMENT_ID, handleBarcodeDetected, isBarcodeActive);

  const handleSimulateScan = async () => {
    // Pick a random wine from DB for demo
    const { data: wines } = await supabase.from('wines').select('id, name, producer, vintage, volume_ml, volume_label, primary_barcode').limit(10);
    if (wines && wines.length > 0) {
      const w = wines[Math.floor(Math.random() * wines.length)];
      toast.success(`Barcode detected: ${w.primary_barcode || w.name}`, { duration: 1500 });
      setSelectedWine({ id: w.id, name: w.name, producer: w.producer || '', vintage: w.vintage, volume: w.volume_ml || 750, volumeLabel: w.volume_label || undefined });
      setCountingMethod('barcode');
      setIsCompactQuantity(true);
      setShowQuantity(true);
    } else {
      toast.info('No wines in catalog yet');
    }
  };

  const handleImageCapture = async () => {
    // For now, simulate AI — will be replaced by ai-scan edge function
    const { data: wines } = await supabase.from('wines').select('id, name, producer, vintage, volume_ml, volume_label').limit(10);
    if (wines && wines.length > 0) {
      const w = wines[Math.floor(Math.random() * wines.length)];
      setProgressWine({ id: w.id, name: w.name, producer: w.producer || '', vintage: w.vintage, volume: w.volume_ml || 750 });
      setShowProgress(true);
    }
  };

  const handleProgressComplete = useCallback((wine: any, confidence: number) => {
    setShowProgress(false);
    if (wine) {
      setSelectedWine(wine);
      setCountingMethod('image_ai');
      setIsCompactQuantity(false);
      setShowQuantity(true);
      if (confidence > 0) toast.info(`Confidence: ${confidence.toFixed(1)}%`, { duration: 2000 });
    } else {
      toast.error('Could not identify wine. Try manual search.');
    }
  }, []);

  const handleManualSelect = (wine: any) => {
    setShowManualSearch(false);
    setSelectedWine({ id: wine.id, name: wine.name, producer: wine.producer || '', vintage: wine.vintage, volume: wine.volume_ml || wine.volume || 750 });
    setCountingMethod('manual');
    setIsCompactQuantity(false);
    setShowQuantity(true);
  };

  const handleConfirmCount = async (unopened: number, opened: number, notes: string, locationId?: string) => {
    if (!selectedWine || !user) return;
    try {
      await upsertItem.mutateAsync({
        session_id: sessionId,
        wine_id: selectedWine.id,
        counted_quantity_unopened: unopened,
        counted_quantity_opened: opened,
        counted_at: new Date().toISOString(),
        counted_by: user.id,
        counting_method: countingMethod,
        location: locationId || null,
        notes: notes || null,
      });
      toast.success(`Counted ${unopened + opened} × ${selectedWine.name}`, { duration: 2000 });
      onCount();
    } catch (e: any) {
      toast.error('Failed to save count: ' + e.message);
    }
    setShowQuantity(false);
    setSelectedWine(null);
  };

  const handleCancelQuantity = () => {
    setShowQuantity(false);
    setSelectedWine(null);
  };

  // Build a QuantityWine-compatible object for QuantityPopup
  const wineForPopup = selectedWine ? {
    id: selectedWine.id,
    name: selectedWine.name,
    producer: selectedWine.producer,
    vintage: selectedWine.vintage,
    volume: selectedWine.volume,
    imageUrl: selectedWine.imageUrl,
  } : null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border z-10">
        <div>
          <p className="text-sm font-medium">Session</p>
          <p className="text-xs text-muted-foreground">{counted} counted</p>
        </div>
        <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10" onClick={onEndSession}>
          <StopCircle className="w-3.5 h-3.5 mr-1.5" />
          End
        </Button>
      </div>

      {/* Camera viewfinder area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'barcode' ? (
          <div className="absolute inset-0 flex flex-col">
            <div id={SCANNER_ELEMENT_ID} className="flex-1 bg-black [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&>div]:!border-none [&_img]:hidden" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-40 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-accent rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-accent rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-accent rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-accent rounded-br-xl" />
                <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-accent/80 animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              {isScanning && (
                <p className="text-sm text-foreground/80 bg-card/60 backdrop-blur-sm inline-block px-3 py-1.5 rounded-full">
                  <Scan className="w-3.5 h-3.5 inline mr-1.5 animate-pulse" />
                  Scanning… point at barcode
                </p>
              )}
              {scannerError && (
                <div className="pointer-events-auto inline-flex flex-col items-center gap-2">
                  <p className="text-sm text-destructive bg-card/80 backdrop-blur-sm inline-flex items-center px-3 py-1.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                    Camera unavailable
                  </p>
                  <Button variant="ghost" size="sm" className="text-accent" onClick={handleSimulateScan}>
                    <Zap className="w-4 h-4 mr-1.5" />
                    Simulate Scan
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col">
            <video ref={imageVideoRef} autoPlay playsInline muted className="flex-1 object-cover w-full h-full bg-black" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-72 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-xl" />
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-auto">
              <p className="text-sm text-foreground/80 bg-card/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                Position wine label in frame
              </p>
              <button onClick={handleImageCapture} className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                <div className="w-12 h-12 rounded-full bg-primary/80" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-card/90 backdrop-blur-md border-t border-border px-4 py-4 pb-safe z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => setShowManualSearch(true)} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Search</span>
          </button>
          <div className="flex items-center bg-secondary rounded-full p-1 gap-0.5">
            <button onClick={() => setMode('barcode')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'barcode' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Scan className="w-4 h-4" />
              Barcode
            </button>
            <button onClick={() => setMode('image')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'image' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Camera className="w-4 h-4" />
              Image
            </button>
          </div>
          <div className="w-[52px]" />
        </div>
      </div>

      {/* Overlays */}
      <ManualSearchSheet open={showManualSearch} onClose={() => setShowManualSearch(false)} onSelect={handleManualSelect} />

      {showQuantity && wineForPopup && (
        <QuantityPopup
          wine={wineForPopup}
          compact={isCompactQuantity}
          onConfirm={handleConfirmCount}
          onCancel={handleCancelQuantity}
        />
      )}

      <ScanProgressDialog
        open={showProgress}
        onComplete={handleProgressComplete}
        simulatedWine={progressWine}
      />
    </div>
  );
}
