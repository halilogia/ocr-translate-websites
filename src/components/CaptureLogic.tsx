"use client";

import { AppSettings } from "@/types";
import { TesseractEngine, TesseractResult } from "../engines/TesseractEngine";
import { OllamaEngine, OllamaResult } from "../engines/OllamaEngine";

export interface CaptureResult {
  dataUrl: string;
  isBlack: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export class CaptureService {
  static async performOCR(imageSrc: string, settings: AppSettings): Promise<OCRResult> {
    if (!imageSrc || imageSrc === "data:,") {
      return { text: "", confidence: 0 };
    }
    
    if (settings.ocrEngine === 'ollama') {
      const result: OllamaResult = await OllamaEngine.performOCR(imageSrc, settings.ollamaVisionModel);
      return { text: result.text, confidence: result.confidence };
    } else {
      const result: TesseractResult = await TesseractEngine.performOCR(imageSrc, settings.sourceLanguage);
      return { text: result.text, confidence: result.confidence };
    }
  }

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

    const aiScale = isAether ? Math.min(1.0, 1024 / sw) : 1.0;
    canvas.width = Math.max(64, Math.round(sw * aiScale)); 
    canvas.height = Math.max(64, Math.round(sh * aiScale));
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png');

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
