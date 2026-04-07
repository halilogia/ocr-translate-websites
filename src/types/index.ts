import { Worker } from 'tesseract.js';

export interface Translation {
  id: string;
  original: string;
  translated: string;
  timestamp: number;
}

export interface AppSettings {
  sourceLanguage: string;
  targetLanguage: string;
  engine: 'google' | 'mymemory' | 'ollama' | 'openrouter';
  ocrEngine: 'tesseract' | 'ollama' | 'ocrspace';
  autoScan: boolean;
  scanRegion: ScanRegion | null; // null = full screen
  furigana: boolean;
  ollamaModel: string;
  ollamaVisionModel: string;
  ollamaTranslationModel: string;
  openRouterKey: string;
  openRouterModel: string;
  ocrApiKey: string;
  isGameMode?: boolean;
  autoDetectRegions?: boolean;
}

export type TesseractWorker = Worker | null;

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface ScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TranscriptLine {
  id: string;
  text: string;
  originalText?: string;
  timestamp: number;
}
