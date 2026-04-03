import { Scan, Monitor, X, Play, Pause, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { CaptureService } from "./CaptureLogic";

interface OCRScannerProps {
  onTranscript: (text: string) => void;
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
  sourceLanguage: string;
  setIsStreamActive: (val: boolean) => void;
}

export interface OCRScannerRef {
  selectWindow: () => void;
  openFileUpload: () => void;
}

const OCRScanner = forwardRef<OCRScannerRef, OCRScannerProps>(({ onTranscript, isScanning, setIsScanning, sourceLanguage, setIsStreamActive }, ref) => {
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAutoScan, setIsAutoScan] = useState(false);
  
  const [isSelecting, setIsSelecting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoScanTimer = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    selectWindow: () => selectWindow(),
    openFileUpload: () => fileInputRef.current?.click()
  }));

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const selectWindow = async () => {
    if (isSelecting) return;
    setIsSelecting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: "window"
        },
        audio: false
      });
      
      setStream(mediaStream);
      setIsStreamActive(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      mediaStream.getVideoTracks()[0].onended = () => {
        stopStream();
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error("Window Selection Error:", err);
        setError("Failed to access window.");
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const handleFile = (file: File) => {
    stopStream();
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => startOCR(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreamActive(false);
    }
    setIsAutoScan(false);
  };

  const startOCR = async (imageSrc: string) => {
    setIsScanning(true);
    try {
      console.log("[Kamui] OCR Process Started (Lang:", sourceLanguage, ")");
      const result = await CaptureService.performOCR(imageSrc, sourceLanguage);
      
      if (result.text && result.text.trim().length > 0) {
        console.log("[Kamui] Text Detected!", result.text.substring(0, 30) + "...");
        onTranscript(result.text);
      } else {
        console.log("[Kamui] Snapshot Empty: No text detected");
      }
    } catch (err) {
      console.error("[Kamui] OCR Critical Error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const frame = CaptureService.captureFrame(videoRef.current, canvasRef.current);
    if (frame) startOCR(frame);
  };

  useEffect(() => {
    let active = true;

    const runCaptureLoop = async () => {
      if (!active || !stream) {
        return;
      }

      if (isScanning) {
        console.log("[Kamui] Pipeline Busy: Waiting for current scan to finish...");
        if (active) setTimeout(runCaptureLoop, 1000);
        return;
      }

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          console.log("[Kamui] Capturing Frame...");
          const frame = CaptureService.captureFrame(video, canvasRef.current);
          if (frame) {
            await startOCR(frame);
          } else {
            console.warn("[Kamui] Capture Failed: Empty frame data");
          }
        } else {
          console.log("[Kamui] Waiting for Video Stream: readyState is", video.readyState);
        }
      }
      
      if (active) setTimeout(runCaptureLoop, 2000);
    };

    if (stream) {
      setIsAutoScan(true);
      runCaptureLoop();
    }

    return () => {
      active = false;
    };
  }, [stream, sourceLanguage]); // Removed isScanning from deps to prevent re-triggering the loop start

  return (
    <div style={{ 
      position: 'absolute', 
      top: -9999, 
      left: -9999, 
      opacity: 0, 
      pointerEvents: 'none',
      visibility: 'visible',
      overflow: 'hidden',
      width: '1px',
      height: '1px'
    }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} />
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }} 
      />
    </div>
  );
});

OCRScanner.displayName = "OCRScanner";
export default OCRScanner;
