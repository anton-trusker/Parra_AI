import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface UseBarcodeScanner {
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  isScanning: boolean;
  error: string | null;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function useBarcodeScanner(
  elementId: string,
  onDetected: (code: string) => void,
  active: boolean
): UseBarcodeScanner {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  // Debounce: ignore same barcode within 3s
  const lastCodeRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        // state 2 = scanning, state 3 = paused
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore cleanup errors
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);

    // Stop any existing instance
    await stopScanning();

    try {
      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastCodeRef.current && now - lastTimeRef.current < 3000) {
            return; // debounce
          }
          lastCodeRef.current = decodedText;
          lastTimeRef.current = now;
          onDetectedRef.current(decodedText);
        },
        () => {
          // scan failure (no code found in frame) - ignore
        }
      );

      setIsScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setError(msg);
      setIsScanning(false);
    }
  }, [elementId, stopScanning]);

  // Auto start/stop based on active prop
  useEffect(() => {
    if (active) {
      // Small delay to ensure DOM element exists
      const t = setTimeout(() => startScanning(), 200);
      return () => { clearTimeout(t); stopScanning(); };
    } else {
      stopScanning();
    }
  }, [active, startScanning, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanning(); };
  }, [stopScanning]);

  return { startScanning, stopScanning, isScanning, error };
}
