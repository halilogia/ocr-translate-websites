"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { AppSettings } from "@/types";
import { CaptureService } from "./CaptureLogic";

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
          
          // [ZenLens 30.17] Dynamic Mirroring
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
      } catch (err) {
        console.error("Display Media Error:", err);
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

            console.log(`[ZenLens] TICK: Dispatched to ${settings.ocrEngine.toUpperCase()}...`);
            const result = await CaptureService.performOCR(dataUrl, settings);
            
            if (result.text && result.text.length > 3) {
              console.log(`[ZenLens] ${settings.ocrEngine.toUpperCase()} SUCCESS: "${result.text.slice(0, 30)}..." (${result.confidence}%)`);
              onTranscript(result.text);
            }
          }
        }
      } catch (err: unknown) {
        console.error(`[ZenLens] PIPELINE ERROR:`, err);
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
        console.error("File OCR Error:", err); 
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* [ZenLens 30.15] Visible Ghost Strategy: 
          Placing at 0,0 with near-zero opacity to force the GPU 
          to keep the rendering buffer active on Linux/Mint. */}
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
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
    </>
  );
});

OCRScanner.displayName = "OCRScanner";
export default OCRScanner;
