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
}

export interface OCRScannerRef {
  selectWindow: () => Promise<void>;
  openFileUpload: () => void;
}

const OCRScanner = forwardRef<OCRScannerRef, OCRScannerProps>((props, ref) => {
  const { settings, onTranscript, scanRegion, setIsStreamActive } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<{ title: string; message: string; details?: string } | null>(null);

  const showError = useCallback((title: string, message: string, details?: string) => {
    setError({ title, message, details });
  }, []);

  useImperativeHandle(ref, () => ({
    selectWindow: async () => {
      try {
        console.log("[ZenLens] Requesting Screen Capture...");
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            displaySurface: 'window',
            cursor: 'always'
          } as MediaTrackConstraints,
          audio: false
        });

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
            setIsStreamActive(false);
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        showError(
          'Screen Capture Failed',
          'Could not capture the selected window',
          errorMsg
        );
      }
    },
    openFileUpload: () => {
      fileInputRef.current?.click();
    }
  }));

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const runCaptureLoop = async () => {
      if (!active) return;

      try {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          
          if (video.srcObject && video.videoWidth > 0 && video.readyState >= 2) {
            const isAether = settings.ocrEngine === 'ollama';
            const { dataUrl, isBlack } = CaptureService.captureFrame(video, canvasRef.current, scanRegion || undefined, isAether);
            
            if (isBlack) {
              if (active) {
                const interval = settings.ocrEngine === 'ollama' ? 2000 : 1000;
                timeoutId = setTimeout(runCaptureLoop, interval);
              }
              return;
            }

            const result = await CaptureService.performOCR(dataUrl, settings);
            
            if (result.text && result.text.length > 3) {
              console.log(`[ZenLens] ${settings.ocrEngine.toUpperCase()} SUCCESS: "${result.text.slice(0, 50)}..." (${result.confidence}%)`);
              onTranscript(result.text);
            }
          }
        }
      } catch (err: unknown) {
        const ocrError = err as OCRError;
        
        if (ocrError.code) {
          showError(
            ocrError.message,
            ocrError.details || 'An error occurred during OCR processing'
          );
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          showError(
            'OCR Pipeline Error',
            'An unexpected error occurred during text recognition',
            errorMsg
          );
        }
      }
      
      if (active) {
        const interval = settings.ocrEngine === 'ollama' ? 2000 : 1000;
        timeoutId = setTimeout(runCaptureLoop, interval);
      }
    };

    runCaptureLoop();
    return () => { 
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [settings, scanRegion, onTranscript]);

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
