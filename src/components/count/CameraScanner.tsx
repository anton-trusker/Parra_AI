import { useState, useCallback } from 'react';
import { Scan, Camera, Search, StopCircle, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wine, mockWines } from '@/data/mockWines';
import { toast } from 'sonner';
import ManualSearchSheet from './ManualSearchSheet';
import QuantityPopup from './QuantityPopup';
import ScanProgressDialog from './ScanProgressDialog';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

type ScanMode = 'barcode' | 'image';

interface CameraScannerProps {
  sessionId: string;
  counted: number;
  onCount: () => void;
  onEndSession: () => void;
}

const SCANNER_ELEMENT_ID = 'barcode-scanner-region';

export default function CameraScanner({ sessionId, counted, onCount, onEndSession }: CameraScannerProps) {
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [showQuantity, setShowQuantity] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressWine, setProgressWine] = useState<Wine | null>(null);
  const [isCompactQuantity, setIsCompactQuantity] = useState(false);

  // Real barcode detection handler
  const handleBarcodeDetected = useCallback((code: string) => {
    // Try to match barcode against mock wines
    const matchedWine = mockWines.find(w => w.barcode === code);
    if (matchedWine) {
      toast.success(`Barcode matched: ${matchedWine.name}`, { duration: 1500 });
      setSelectedWine(matchedWine);
    } else {
      // Unknown barcode — still show popup with info
      toast.info(`Barcode scanned: ${code}`, { description: 'Wine not found in catalog. Try manual search.', duration: 3000 });
      return;
    }
    setIsCompactQuantity(true);
    setShowQuantity(true);
  }, []);

  const isBarcodeActive = mode === 'barcode' && !showQuantity && !showManualSearch && !showProgress;
  const { isScanning, error: scannerError } = useBarcodeScanner(SCANNER_ELEMENT_ID, handleBarcodeDetected, isBarcodeActive);

  // Simulate barcode for demo (fallback)
  const handleSimulateScan = () => {
    const randomWine = mockWines[Math.floor(Math.random() * mockWines.length)];
    toast.success(`Barcode detected: ${randomWine.barcode || randomWine.sku}`, { duration: 1500 });
    setSelectedWine(randomWine);
    setIsCompactQuantity(true);
    setShowQuantity(true);
  };

  // Simulate image capture
  const handleImageCapture = () => {
    const randomWine = mockWines[Math.floor(Math.random() * mockWines.length)];
    setProgressWine(randomWine);
    setShowProgress(true);
  };

  const handleProgressComplete = useCallback((wine: Wine | null, confidence: number) => {
    setShowProgress(false);
    if (wine) {
      setSelectedWine(wine);
      setIsCompactQuantity(false);
      setShowQuantity(true);
      if (confidence > 0) {
        toast.info(`Confidence: ${confidence.toFixed(1)}%`, { duration: 2000 });
      }
    } else {
      toast.error('Could not identify wine. Try manual search.');
    }
  }, []);

  const handleManualSelect = (wine: Wine) => {
    setShowManualSearch(false);
    setSelectedWine(wine);
    setIsCompactQuantity(false);
    setShowQuantity(true);
  };

  const handleConfirmCount = (unopened: number, opened: number, notes: string) => {
    if (!selectedWine) return;
    toast.success(`Counted ${unopened + opened} × ${selectedWine.name}`, { duration: 2000 });
    onCount();
    setShowQuantity(false);
    setSelectedWine(null);
  };

  const handleCancelQuantity = () => {
    setShowQuantity(false);
    setSelectedWine(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border z-10">
        <div>
          <p className="text-sm font-medium">Session #{sessionId}</p>
          <p className="text-xs text-muted-foreground">{counted} counted</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={onEndSession}
        >
          <StopCircle className="w-3.5 h-3.5 mr-1.5" />
          End
        </Button>
      </div>

      {/* Camera viewfinder area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'barcode' ? (
          <div className="absolute inset-0 flex flex-col">
            {/* Real camera feed from html5-qrcode */}
            <div
              id={SCANNER_ELEMENT_ID}
              className="flex-1 bg-black [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&>div]:!border-none [&_img]:hidden"
            />

            {/* Overlay scanning frame on top of camera */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-40 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-accent rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-accent rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-accent rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-accent rounded-br-xl" />
                {/* Scanning line */}
                <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-accent/80 animate-pulse" />
              </div>
            </div>

            {/* Status overlay */}
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
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background flex items-center justify-center">
            <div className="text-center">
              <div className="w-56 h-72 border-2 border-primary/50 rounded-xl relative mb-4 mx-auto flex items-center justify-center">
                <Camera className="w-12 h-12 text-primary/40" />
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
              <p className="text-sm text-muted-foreground">Position wine label in frame</p>
              <button
                onClick={handleImageCapture}
                className="mt-4 w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center mx-auto hover:scale-105 transition-transform active:scale-95"
              >
                <div className="w-12 h-12 rounded-full wine-gradient" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-card/90 backdrop-blur-md border-t border-border px-4 py-4 pb-safe z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => setShowManualSearch(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Search</span>
          </button>

          <div className="flex items-center bg-secondary rounded-full p-1 gap-0.5">
            <button
              onClick={() => setMode('barcode')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'barcode'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Scan className="w-4 h-4" />
              Barcode
            </button>
            <button
              onClick={() => setMode('image')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'image'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="w-4 h-4" />
              Image
            </button>
          </div>

          <div className="w-[52px]" />
        </div>
      </div>

      {/* Overlays */}
      <ManualSearchSheet open={showManualSearch} onClose={() => setShowManualSearch(false)} onSelect={handleManualSelect} />
      
      {showQuantity && selectedWine && (
        <QuantityPopup
          wine={selectedWine}
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
