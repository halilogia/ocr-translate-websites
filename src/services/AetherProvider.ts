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
          prompt: "Extract all visible text from this image. Output ONLY the raw text found, maintaining original line breaks. Do not add descriptions, headers, or explanations. If text is unclear, output what you can read."
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
