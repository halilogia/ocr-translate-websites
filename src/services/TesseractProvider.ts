"use client";

import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export class TesseractProvider {
  private static worker: Worker | null = null;

  private static async getWorker(lang: string = 'eng'): Promise<Worker> {
    if (this.worker) return this.worker;
    
    console.log("[ZenLens] Booting local Tesseract engine...");
    this.worker = await createWorker(lang as any);
    return this.worker;
  }

  /**
   * Performs local OCR using Tesseract.js (WASM).
   * No fallback to AI/Ollama here.
   */
  static async performOCR(imageSrc: string, lang: string = 'eng'): Promise<OCRResult> {
    if (!imageSrc || imageSrc === "data:,") return { text: "", confidence: 0 };

    try {
      const worker = await this.getWorker(lang);
      const { data } = await worker.recognize(imageSrc);

      // Intelligent Noise Gate (Min chars and confidence)
      if (data.text && data.text.trim().length > 3 && data.confidence > 12) {
        let cleanText = data.text.replace(/[%|{}[\]\\/]/g, '').trim();
        if (cleanText.length < 3) return { text: "", confidence: 0 };

        return {
          text: cleanText,
          confidence: data.confidence
        };
      }

      return { text: "", confidence: 0 };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Tesseract Error';
      console.error(`[ZenLens] Tesseract Failure: ${msg}`);
      throw new Error(`TESSERACT ERROR: ${msg}`); // Throw it so user sees it in logs
    }
  }

  static async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
