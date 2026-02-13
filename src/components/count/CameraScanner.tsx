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
  const [aiResult, setAiResult] = useState<any>(null);
  const [isCompactQuantity, setIsCompactQuantity] = useState(false);
  const [countingMethod, setCountingMethod] = useState<'barcode' | 'manual' | 'image_ai'>('barcode');
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
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

  // Real AI image capture
  const handleImageCapture = async () => {
    const video = imageVideoRef.current;
    if (!video || !video.videoWidth) {
      toast.error('Camera not ready');
      return;
    }

    // Capture frame from video
    const canvas = document.createElement('canvas');
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 (strip data URL prefix)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];

    // Show progress dialog with pending state
    setAiResult(null);
    setShowProgress(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-recognize-label', {
        body: { image_base64: base64, session_id: sessionId },
      });

      if (error) throw error;
      setAiResult(data);
    } catch (e: any) {
      console.error('AI recognition error:', e);
      setAiResult({ status: 'failed', error: e.message });
    }
  };

  const handleProgressComplete = useCallback((wine: any, confidence: number) => {
    setShowProgress(false);
    if (wine) {
      setSelectedWine(wine);
      setCountingMethod('image_ai');
      setIsCompactQuantity(false);
      setShowQuantity(true);
      if (confidence > 0) toast.info(`AI Confidence: ${confidence.toFixed(0)}%`, { duration: 2000 });
    } else {
      toast.error('Could not identify wine. Try manual search.');
    }
  }, []);

  const handleVariantSelect = (wine: any) => {
    setShowVariantPicker(false);
    setVariants([]);
    setSelectedWine({
      id: wine.id,
      name: wine.name,
      producer: wine.producer || '',
      vintage: wine.vintage,
      volume: wine.volume_ml || 750,
      volumeLabel: wine.volume_label || undefined,
    });
    setCountingMethod('image_ai');
    setIsCompactQuantity(false);
    setShowQuantity(true);
  };

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
              AI Scan
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
        aiResult={aiResult}
        onComplete={handleProgressComplete}
        onManualSearch={() => { setShowProgress(false); setShowManualSearch(true); }}
        onSelectVariant={(v) => { setShowProgress(false); handleVariantSelect(v); }}
      />

      {/* Variant picker overlay */}
      {showVariantPicker && variants.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setShowVariantPicker(false)} />
          <div className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-4 pb-safe max-h-[60vh] overflow-y-auto">
            <h3 className="font-heading font-semibold mb-3">Select Vintage</h3>
            <div className="space-y-2">
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVariantSelect(v)}
                  className="w-full p-3 rounded-lg border border-border hover:border-primary/50 text-left transition-colors"
                >
                  <p className="font-medium">{v.name}</p>
                  <p className="text-sm text-muted-foreground">{v.vintage || 'NV'} · {v.volume_ml || 750}ml</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
