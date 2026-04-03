"use client";

import { OCRError } from "./TesseractEngine";

export interface OllamaResult {
  text: string;
  confidence: number;
}

export class OllamaEngine {
  static async performOCR(imageSrc: string, model: string): Promise<OllamaResult> {
    if (!imageSrc || imageSrc === "data:,") {
      return { text: "", confidence: 0 };
    }

    if (!model) {
      throw {
        code: 'NO_MODEL',
        message: 'No Ollama vision model selected',
        details: 'Please select a vision model in Settings (e.g., llava, moondream). You can install one using: ollama pull llava'
      } as OCRError;
    }

    try {
      console.log(`[OllamaEngine] === START OCR REQUEST ===`);
      console.log(`[OllamaEngine] Model: ${model}`);
      console.log(`[OllamaEngine] Image size: ${imageSrc.length} bytes`);
      console.log(`[OllamaEngine] Sending request to /api/ocr...`);

      const startTime = Date.now();
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc,
          model: model,
          prompt: "Extract ALL visible text from this image. Output ONLY the raw text found, maintaining original line breaks and formatting. Do not add descriptions, headers, explanations, or commentary. If text is unclear, output what you can read accurately."
        })
      });
      
      const duration = Date.now() - startTime;
      console.log(`[OllamaEngine] Response received in ${duration}ms`);
      console.log(`[OllamaEngine] Response status: ${response.status}`);
      console.log(`[OllamaEngine] Response headers:`, Object.fromEntries(response.headers.entries()));
      console.log(`[OllamaEngine] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errorDetails = errData.error || errorDetails;
        } catch {}

        if (response.status === 404) {
          throw {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found`,
            details: `The model "${model}" is not installed in Ollama.\n\nInstall it with:\nollama pull ${model}\n\nOr select a different model in Settings.`
          } as OCRError;
        }

        if (response.status === 500) {
          throw {
            code: 'OLLAMA_SERVER_ERROR',
            message: 'Ollama server error',
            details: `Ollama returned an internal error: ${errorDetails}\n\nMake sure Ollama is running:\nollama serve`
          } as OCRError;
        }

        throw {
          code: 'API_ERROR',
          message: `Ollama API error (${response.status})`,
          details: errorDetails
        } as OCRError;
      }

      const result = await response.json();
      console.log(`[OllamaEngine] Response text length: ${result.text?.length || 0}`);
      
      if (!result.text || result.text.trim().length < 2) {
        return { text: "", confidence: 0 };
      }

      return {
        text: result.text.trim(),
        confidence: 100
      };
    } catch (error: unknown) {
      if ((error as OCRError).code) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[OllamaEngine] Error: ${errorMessage}`);
      
      if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
        throw {
          code: 'TIMEOUT',
          message: 'Ollama request timed out',
          details: `The request to Ollama took too long.\n\nPossible causes:\n- Image is too large or complex\n- Ollama is busy with other requests\n- Model is loading for the first time\n\nTry again or use a simpler image.`
        } as OCRError;
      }

      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw {
          code: 'CONNECTION_ERROR',
          message: 'Cannot connect to Ollama',
          details: `Could not connect to Ollama at http://localhost:11434\n\nMake sure Ollama is running:\n1. Open terminal\n2. Run: ollama serve\n3. Try again`
        } as OCRError;
      }

      throw {
        code: 'UNKNOWN_ERROR',
        message: 'Ollama OCR failed',
        details: errorMessage
      } as OCRError;
    }
  }
}
