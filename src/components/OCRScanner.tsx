"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { AppSettings } from "@/types";
import { CaptureService } from "./CaptureLogic";
import ErrorPopup from "./ui/ErrorPopup";
import { OCRError } from "../engines/TesseractEngine";

interface OCRScannerProps {
  settings: AppSettings;
  onTranscript: (text: string) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  sourceLanguage: string;
  scanRegion: { x: number, y: number, width: number, height: number } | null;
  setIsStreamActive: (active: boolean) => void;
  onStreamChange?: (stream: MediaStream | null) => void;
}

export interface OCRScannerRef {
  selectWindow: () => Promise<void>;
  openFileUpload: () => void;
  selectRegion: () => Promise<void>;
}

const OCRScanner = forwardRef<OCRScannerRef, OCRScannerProps>((props, ref) => {
  const { settings, onTranscript, scanRegion, setIsStreamActive, onStreamChange } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<{ title: string; message: string; details?: string } | null>(null);
  const lastTextRef = useRef<string>('');
  const lastTextTimeRef = useRef<number>(0);
  const consecutiveBlackFramesRef = useRef<number>(0);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const hasRunRef = useRef(false);

  const getFingerprint = useCallback((text: string): string => {
    return text.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/[ğüşıöçĞÜŞİÖÇ]/g, (c) => {
        const map: Record<string, string> = { 'ğ':'g','ü':'u','ş':'s','ı':'i','ö':'o','ç':'c','Ğ':'g','Ü':'u','Ş':'s','İ':'i','Ö':'o','Ç':'c' };
        return map[c] || c;
      })
      .trim()
      .split(' ')
      .slice(0, 15)
      .join(' ');
  }, []);

  const textSimilarity = useCallback((a: string, b: string): number => {
    const normA = getFingerprint(a);
    const normB = getFingerprint(b);
    const longer = normA.length > normB.length ? normA : normB;
    const shorter = normA.length > normB.length ? normB : normA;
    if (longer.length === 0) return 1.0;
    if (longer.includes(shorter) && shorter.length > 10) return 0.95;
    const editDist = (s1: string, s2: string): number => {
      const matrix: number[][] = [];
      for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
      for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
          if (s2[i-1] === s1[j-1]) matrix[i][j] = matrix[i-1][j-1];
          else matrix[i][j] = Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
        }
      }
      return matrix[s2.length][s1.length];
    };
    return (longer.length - editDist(longer, shorter)) / longer.length;
  }, [getFingerprint]);

  const showError = useCallback((title: string, message: string, details?: string) => {
    setError({ title, message, details });
  }, []);

  useImperativeHandle(ref, () => ({
    selectWindow: async () => {
      try {
        // Stop existing stream first
        if (currentStreamRef.current) {
          currentStreamRef.current.getTracks().forEach(track => track.stop());
          currentStreamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsStreamActive(false);
        consecutiveBlackFramesRef.current = 0;
        lastTextRef.current = '';
        
        console.log("[ZenLens] Requesting Screen Capture...");
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            displaySurface: 'window',
            cursor: 'always'
          } as MediaTrackConstraints,
          audio: false
        });
        
        currentStreamRef.current = stream;
        
        // Notify parent about stream change
        onStreamChange?.(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            const video = videoRef.current;
            if (video) {
              video.style.width = `${video.videoWidth}px`;
              video.style.height = `${video.videoHeight}px`;
              console.log("[ZenLens] Signal Lock: Stream Ready", video.videoWidth, "x", video.videoHeight);
              video.play().catch(e => console.error("Play Failed", e));
              setIsStreamActive(true);
            }
          };
          stream.getVideoTracks()[0].onended = () => {
            console.log("[ZenLens] Stream ended by user");
            currentStreamRef.current = null;
            setIsStreamActive(false);
            onStreamChange?.(null);
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        showError('Screen Capture Failed', 'Could not capture the selected window', errorMsg);
      }
    },
    openFileUpload: () => {
      fileInputRef.current?.click();
    },
    selectRegion: async () => {
      // This will be handled by ZenLensApp with an overlay
      // Just signal that region selection mode is active
      console.log("[ZenLens] Region selection mode activated");
    }
  }));

  // Use refs for settings to avoid re-triggering the effect when settings change
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const scanRegionRef = useRef(scanRegion);
  useEffect(() => {
    scanRegionRef.current = scanRegion;
  }, [scanRegion]);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const runCaptureLoop = async () => {
      if (!active) return;
      try {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          if (video.srcObject && video.videoWidth > 0 && video.readyState >= 2) {
            const currentSettings = settingsRef.current;
            const currentScanRegion = scanRegionRef.current;
            const isAether = currentSettings.ocrEngine === 'ollama';
            const { dataUrl, isBlack } = CaptureService.captureFrame(video, canvasRef.current, currentScanRegion || undefined, isAether);
            if (isBlack) {
              consecutiveBlackFramesRef.current++;
              // If we get 30+ consecutive black frames, the stream is likely dead
              if (consecutiveBlackFramesRef.current > 30) {
                console.log("[ZenLens] Too many black frames - stream may be dead");
                if (currentStreamRef.current) {
                  currentStreamRef.current.getTracks().forEach(track => track.stop());
                  currentStreamRef.current = null;
                }
                if (videoRef.current) {
                  videoRef.current.srcObject = null;
                }
                setIsStreamActive(false);
                consecutiveBlackFramesRef.current = 0;
              }
              if (active) {
                timeoutId = setTimeout(runCaptureLoop, 1000);
              }
              return;
            }
            
            // Reset black frame counter on successful frame
            consecutiveBlackFramesRef.current = 0;

            // FRAME DIFF: Only OCR if screen actually changed
            const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (context && !CaptureService.hasFrameChanged(context, canvasRef.current.width, canvasRef.current.height)) {
              // Screen unchanged - check again in 500ms (fast poll for changes)
              if (active) {
                timeoutId = setTimeout(runCaptureLoop, 500);
              }
              return;
            }
            
            // AUTO-DETECT REGIONS: Find text areas and crop to them
            let ocrDataUrl = dataUrl;
            if (currentSettings.autoDetectRegions && context) {
              const regions = CaptureService.detectTextRegions(context, canvasRef.current.width, canvasRef.current.height);
              if (regions.length > 0) {
                // Merge all regions into one bounding box
                let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
                for (const r of regions) {
                  minX = Math.min(minX, r.x);
                  minY = Math.min(minY, r.y);
                  maxX = Math.max(maxX, r.x + r.width);
                  maxY = Math.max(maxY, r.y + r.height);
                }
                
                // Add padding
                const padding = 10;
                minX = Math.max(0, minX - padding);
                minY = Math.max(0, minY - padding);
                maxX = Math.min(canvasRef.current.width, maxX + padding);
                maxY = Math.min(canvasRef.current.height, maxY + padding);
                
                // Create cropped canvas
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = maxX - minX;
                cropCanvas.height = maxY - minY;
                const cropCtx = cropCanvas.getContext('2d');
                if (cropCtx) {
                  cropCtx.drawImage(canvasRef.current, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
                  ocrDataUrl = cropCanvas.toDataURL('image/png');
                  console.log(`[ZenLens] Auto-detected ${regions.length} text regions, cropped to ${cropCanvas.width}x${cropCanvas.height}`);
                }
              } else {
                console.log(`[ZenLens] No text regions detected, skipping OCR`);
                if (active) {
                  timeoutId = setTimeout(runCaptureLoop, 2000);
                }
                return;
              }
            }
            
            const result = await CaptureService.performOCR(ocrDataUrl, currentSettings);
            if (result.text && result.text.length > 3) {
              const trimmedText = result.text.trim();
              
              // Prevent double execution from React StrictMode
              if (hasRunRef.current) return;
              hasRunRef.current = true;
              setTimeout(() => { hasRunRef.current = false; }, 200);
              
              const now = Date.now();
              const fingerprint = getFingerprint(trimmedText);
              
              // AGGRESSIVE duplicate filter for self-capture loop
              if (lastTextRef.current) {
                const timeDiff = now - lastTextTimeRef.current;
                const lastFingerprint = getFingerprint(lastTextRef.current);
                
                // Exact fingerprint match within 5 minutes = definitely duplicate
                if (fingerprint === lastFingerprint && timeDiff < 300000) {
                  if (active) {
                    timeoutId = setTimeout(runCaptureLoop, 2000);
                  }
                  return;
                }
                
                // High similarity within 2 minutes = likely self-capture loop
                const similarity = textSimilarity(trimmedText, lastTextRef.current);
                if (similarity > 0.5 && timeDiff < 120000) {
                  if (active) {
                    timeoutId = setTimeout(runCaptureLoop, 2000);
                  }
                  return;
                }
              }
              
              lastTextRef.current = trimmedText;
              lastTextTimeRef.current = now;
              console.log(`[ZenLens] ${currentSettings.ocrEngine.toUpperCase()} SUCCESS: "${trimmedText.slice(0, 50)}..." (${result.confidence}%)`);
              onTranscript(trimmedText);
            }
          }
        }
      } catch (err: unknown) {
        const ocrError = err as OCRError;
        if (ocrError.code) {
          showError(ocrError.message, ocrError.details || 'An error occurred during OCR processing');
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          showError('OCR Pipeline Error', 'An unexpected error occurred during text recognition', errorMsg);
        }
      }
      if (active) {
        timeoutId = setTimeout(runCaptureLoop, 2000);
      }
    };

    runCaptureLoop();
    return () => { 
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
      // Don't stop the stream on cleanup - let it persist across settings changes
    };
  }, [onTranscript, setIsStreamActive, textSimilarity, showError, getFingerprint]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const result = await CaptureService.performOCR(dataUrl, settings);
        if (result.text) onTranscript(result.text);
      } catch (err: unknown) { 
        const ocrError = err as OCRError;
        if (ocrError.code) {
          showError(ocrError.message, ocrError.details || 'File OCR failed');
        } else {
          showError('File OCR Error', 'Could not process the selected image');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <video 
        ref={videoRef} 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0,
          width: '320px', 
          height: '240px', 
          opacity: 0.01, 
          zIndex: -10,
          pointerEvents: 'none' 
        }} 
        autoPlay 
        playsInline 
        muted 
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      {error && (
        <ErrorPopup
          title={error.title}
          message={error.message}
          details={error.details}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
});

OCRScanner.displayName = "OCRScanner";
export default OCRScanner;
