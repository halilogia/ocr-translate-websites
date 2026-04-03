"use client";

import { AppSettings } from "@/types";

export interface OCRError {
  code: string;
  message: string;
  details?: string;
}

export interface TesseractResult {
  text: string;
  confidence: number;
}

export class TesseractEngine {
  private static worker: any = null;
  private static isInitializing = false;

  private static async initializeWorker(lang: string): Promise<any> {
    if (this.worker) return this.worker;
    if (this.isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.worker;
    }

    this.isInitializing = true;
    try {
      const { createWorker } = await import('tesseract.js');
      this.worker = await createWorker(lang as any);
      this.isInitializing = false;
      return this.worker;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  static async performOCR(imageSrc: string, lang: string): Promise<TesseractResult> {
    if (!imageSrc || imageSrc === "data:,") {
      return { text: "", confidence: 0 };
    }

    try {
      const worker = await this.initializeWorker(lang);
      const { data } = await worker.recognize(imageSrc);

      if (data.text && data.text.trim().length > 2 && data.confidence > 20) {
        const cleanText = data.text.replace(/[%|{}[\]\\/]/g, '').trim();
        if (cleanText.length < 2) return { text: "", confidence: 0 };

        return {
          text: cleanText,
          confidence: data.confidence
        };
      }

      return { text: "", confidence: 0 };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw {
        code: 'TESSERACT_ERROR',
        message: 'Tesseract OCR failed',
        details: errorMessage
      } as OCRError;
    }
  }

  static async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
