"use client";

import { AppSettings } from "@/types";

export interface OCRResult {
  text: string;
  confidence: number;
}

export class AetherProvider {
  /**
   * Performs high-fidelity OCR using the local Ollama vision engine.
   * No fallback to Tesseract here.
   */
  static async performOCR(imageSrc: string, model: string): Promise<OCRResult> {
    if (!imageSrc || imageSrc === "data:,") return { text: "", confidence: 0 };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc,
          model: model,
          prompt: "OCR: Extract all text from this image accurately. Output only the found text without any descriptions or headers."
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Aether Failure (${response.status}): ${errData.error || 'Unknown'}`);
      }

      const result = await response.json();
      if (!result.text || result.text.length < 2) {
         return { text: "", confidence: 0 };
      }

      return {
        text: result.text.trim(),
        confidence: 100
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown AI Error';
      console.error(`[ZenLens] Aether Failure: ${msg}`);
      throw new Error(`OLLAMA ERROR: ${msg}`); // Throw it so user sees it in logs
    }
  }
}
