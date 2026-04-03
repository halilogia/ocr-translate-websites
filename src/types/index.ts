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
  ocrEngine: 'tesseract' | 'ollama' | 'ocrspace';
  autoScan: boolean;
  scanRegion: 'full' | 'selected';
  furigana: boolean;
  ollamaModel: string;
  ollamaVisionModel: string;
  openRouterKey: string;
  openRouterModel: string;
  ocrApiKey: string;
  isGameMode?: boolean;
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
  timestamp: number;
}

export interface TranscriptLine {
  id: string;
  text: string;
  timestamp: number;
}
