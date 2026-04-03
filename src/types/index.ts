import { Worker } from 'tesseract.js';

export interface Translation {
  id: string;
  original: string;
  translated: string;
  timestamp: number;
}

export interface AppSettings {
  translationMode: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  engine: 'google' | 'mymemory' | 'ollama' | 'openrouter';
  autoScan: boolean;
  scanRegion: 'full' | 'selected';
  furigana: boolean;
  ollamaModel: string;
  openRouterKey: string;
  openRouterModel: string;
}

export type TesseractWorker = Worker | null;

export interface OCRResult {
  text: string;
  confidence: number;
}
