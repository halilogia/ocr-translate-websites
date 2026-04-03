"use client";

import { createWorker, Worker } from "tesseract.js";
import { TesseractWorker, OCRResult } from "@/types";

export class CaptureService {
  private static currentLang: string = 'eng';
  private static worker: any = null;

  static async getWorker(lang: string = 'eng'): Promise<Worker> {
    if (this.worker && this.currentLang === lang) return this.worker;
    
    if (this.worker) await this.terminateWorker();
    
    const worker = await createWorker(lang, 1);
    this.worker = worker;
    this.currentLang = lang;
    return worker;
  }

  static async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  static async performOCR(imageSrc: string, lang: string = 'eng'): Promise<OCRResult> {
    if (!imageSrc || imageSrc === "data:,") return { text: "", confidence: 0 };
    
    try {
      const worker = await this.getWorker(lang);
      
      // Auto Page Segmentation for Game UIs
      await worker.setParameters({
        tessedit_pageseg_mode: '3' as any, // PSM 3: Fully automatic segmentation
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
      });

      const { data: { text, confidence } } = await worker.recognize(imageSrc);
      return { text: text || "", confidence };
    } catch (err) {
      console.error("OCR Service Error:", err);
      return { text: "", confidence: 0 };
    }
  }

  static captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    // Use 3x scaling for high-precision game text
    const scale = 3;
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    // Draw with scaling and high quality sharpening
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply Preprocessing Filters (Adaptive Thresholding)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // 1. Grayscale Conversion
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 2. Adaptive Thresholding (Mean-C)
    // We use a simpler block-average to keep it fast in pure JS
    const blockSize = 15; // Local area size
    const C = 10; // Constant delta
    
    const output = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const currentPixel = grayscale[idx];
        
        // Dynamic Thresholding (Sampled block average for speed)
        let sum = 0;
        let count = 0;
        const half = 7; // blockSize/2
        
        // Performance-first sampling (Skip 2 to handle resolution)
        for (let dy = -half; dy <= half; dy += 2) {
          for (let dx = -half; dx <= half; dx += 2) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += grayscale[ny * width + nx];
              count++;
            }
          }
        }
        
        const avg = sum / (count || 1);
        
        // If current pixel is significantly brighter than local surroundings, its text
        // (Black text on white background required for Tesseract)
        const isText = currentPixel > (avg + C);
        const val = isText ? 0 : 255; 
        
        const outIdx = idx * 4;
        output[outIdx] = val;
        output[outIdx + 1] = val;
        output[outIdx + 2] = val;
        output[outIdx + 3] = 255;
      }
    }
    
    context.putImageData(new ImageData(output, width, height), 0, 0);
    return canvas.toDataURL('image/png');
  }
}
