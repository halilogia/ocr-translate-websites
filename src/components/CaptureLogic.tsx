"use client";

import { AppSettings } from "@/types";
import { AetherProvider, OCRResult } from "../services/AetherProvider";
import { TesseractProvider } from "../services/TesseractProvider";

/**
 * ZenLens Vision Dispatcher (v30.12)
 * Manages the high-fidelity framing and directs requests to either 
 * the Aether (AI) or Tesseract (Local) providers based strictly on settings.
 */
export interface CaptureResult {
  dataUrl: string;
  isBlack: boolean;
}

export class CaptureService {
  /**
   * Main Dispatcher (v30.12): No more automatic fallback.
   * If you select Ollama, we only run Ollama. If it fails, that's your log.
   */
  static async performOCR(imageSrc: string, settings: AppSettings): Promise<OCRResult> {
    if (!imageSrc || imageSrc === "data:,") return { text: "", confidence: 0 };
    
    // Dispatch to the selected provider ONLY
    if (settings.ocrEngine === 'ollama' && settings.ollamaVisionModel) {
      console.log(`[ZenLens] Dispatched to AETHER (Model: ${settings.ollamaVisionModel})`);
      return await AetherProvider.performOCR(imageSrc, settings.ollamaVisionModel);
    } else {
      console.log(`[ZenLens] Dispatched to TESSERACT (Local Engine)`);
      return await TesseractProvider.performOCR(imageSrc, settings.sourceLanguage);
    }
  }

  /**
   * High-Fidelity Crystal Capture Frame
   */
  static captureFrame(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    region?: { x: number, y: number, width: number, height: number },
    isAether: boolean = false
  ): CaptureResult {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return { dataUrl: "", isBlack: true };

    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    
    if (region) {
      sx = (region.x / 100) * video.videoWidth;
      sy = (region.y / 100) * video.videoHeight;
      sw = (region.width / 100) * video.videoWidth;
      sh = (region.height / 100) * video.videoHeight;
      
      sx = Math.max(0, sx); sy = Math.max(0, sy);
      sw = Math.min(sw, video.videoWidth - sx);
      sh = Math.min(sh, video.videoHeight - sy);
    }

    // [ZenLens 30.11] Aether Optimizer:
    // Scale image for AI (1024px max) to prevent bandwidth bottleneck
    const aiScale = isAether ? Math.min(1.0, 1024 / sw) : 2.0;
    canvas.width = Math.max(64, sw * aiScale); 
    canvas.height = Math.max(64, sh * aiScale);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    
    // [ZenLens 30.18] Relaxed Mode: Force PNG for better WASM compatibility
    const dataUrl = canvas.toDataURL('image/png');

    // Black Frame Detection & In-App Alerts
    const sampleSize = 20;
    const checkData = context.getImageData(0, 0, sampleSize, sampleSize).data;
    let totalBrightness = 0;
    const pixelCount = sampleSize * sampleSize;
    
    for(let i=0; i<checkData.length; i+=4) {
        const brightness = (checkData[i] + checkData[i+1] + checkData[i+2]) / 3;
        totalBrightness += brightness;
    }
    
    const averageBrightness = totalBrightness / pixelCount;
    const isBlack = averageBrightness < 15;
    
    if(isBlack && typeof document !== 'undefined') {
        const thumbContainer = document.getElementById('vision-thumbnail-container');
        if(thumbContainer) thumbContainer.innerHTML = `<div style="color:#ef4444;font-size:10px;text-align:center;margin-top:20px;font-weight:bold">BLACK FRAME</div>`;
    } else if(typeof document !== 'undefined') {
        const thumbContainer = document.getElementById('vision-thumbnail-container');
        if(thumbContainer && thumbContainer.querySelector('img')) {
          (thumbContainer.querySelector('img') as HTMLImageElement).src = dataUrl;
        } else if(thumbContainer) {
          thumbContainer.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
        }
    }

    return { dataUrl, isBlack };
  }
}
