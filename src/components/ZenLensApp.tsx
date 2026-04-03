"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./Sidebar";
import TranslationDisplay from "./workspace/TranslationDisplay";
import SettingsTray from "./panels/SettingsTray";
import OCRScanner from "./OCRScanner";
import { AppSettings, TranscriptLine } from "@/types";
import { OCRScannerRef } from "./OCRScanner";
import { motion } from "framer-motion";

const DEFAULT_SETTINGS: AppSettings = {
  translationMode: false,
  sourceLanguage: 'eng',
  targetLanguage: 'tr',
  engine: 'google',
  ocrEngine: 'tesseract',
  autoScan: false,
  scanRegion: 'full',
  furigana: false,
  ollamaModel: '',
  ollamaVisionModel: '',
  ollamaTranslationModel: '',
  openRouterKey: '',
  openRouterModel: '',
  ocrApiKey: '',
  isGameMode: false
};

export default function ZenLensApp() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("translator");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const scannerRef = useRef<OCRScannerRef | null>(null);

  // Persistence & Purge
  useEffect(() => {
    const saved = localStorage.getItem('zenlens-v1-settings');
    let initialSettings = DEFAULT_SETTINGS;
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ollamaVisionModel === 'llava') parsed.ollamaVisionModel = '';
        initialSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e: unknown) {
        console.error("Settings load failed:", e);
      }
    }
    
    setSettings(initialSettings);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('zenlens-v1-settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const [lastProcessedText, setLastProcessedText] = useState<string>('');
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0);
  const transcriptHistoryRef = useRef<string[]>([]);

  const textSimilarity = (a: string, b: string): number => {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1.0;
    const editDist = (s1: string, s2: string): number => {
      const matrix: number[][] = [];
      for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
      for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
          if (s2[i-1] === s1[j-1]) matrix[i][j] = matrix[i-1][j-1];
          else matrix[i][j] = Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
        }
      }
      return matrix[s2.length][s1.length];
    };
    return (longer.length - editDist(longer, shorter)) / longer.length;
  };

  const addTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    const trimmedText = text.trim();
    const now = Date.now();
    
    // 1. Exact duplicate check against last processed
    if (trimmedText === lastProcessedText) {
      return;
    }
    
    // 2. Similarity check: if text is >85% similar to last AND within 10 seconds, skip
    if (lastProcessedText && (now - lastProcessedTime < 10000)) {
      const similarity = textSimilarity(trimmedText, lastProcessedText);
      if (similarity > 0.85) {
        console.log(`[ZenLens] Duplicate filtered (${Math.round(similarity*100)}% similar)`);
        return;
      }
    }
    
    // 3. Check against history using ref
    const isDuplicate = transcriptHistoryRef.current.some(existingText => {
      return textSimilarity(trimmedText, existingText) > 0.9;
    });
    if (isDuplicate) {
      console.log('[ZenLens] Duplicate filtered (found in history)');
      return;
    }
    
    // Update tracking
    setLastProcessedText(trimmedText);
    setLastProcessedTime(now);
    transcriptHistoryRef.current = [...transcriptHistoryRef.current, trimmedText].slice(-20);
    
    // Add transcript
    setTranscripts(prev => {
      const newLine: TranscriptLine = {
        id: Date.now().toString(),
        text: trimmedText,
        timestamp: now
      };
      return [...prev, newLine].slice(-10);
    });
    if (isDuplicate) {
      console.log('[ZenLens] Duplicate filtered (found in history)');
      return;
    }
    
    // Update tracking
    setLastProcessedText(trimmedText);
    setLastProcessedTime(now);
    
    // Add transcript
    setTranscripts(prev => {
      const newLine: TranscriptLine = {
        id: Date.now().toString(),
        text: trimmedText,
        timestamp: now
      };
      return [...prev, newLine].slice(-10);
    });
    
    // Translation
    if (settings.engine) {
      try {
        const fromLang = settings.sourceLanguage === 'eng' ? 'en' : 
                        settings.sourceLanguage === 'jpn' ? 'ja' :
                        settings.sourceLanguage === 'kor' ? 'ko' :
                        settings.sourceLanguage === 'tur' ? 'tr' :
                        settings.sourceLanguage.substring(0, 2);
        
        const toLang = settings.targetLanguage === 'tr' ? 'tr' : 
                      settings.targetLanguage === 'en' ? 'en' :
                      settings.targetLanguage === 'de' ? 'de' :
                      settings.targetLanguage.substring(0, 2);
        
        const payload = {
          text: trimmedText,
          from: fromLang,
          to: toLang,
          engine: settings.engine,
          ollamaModel: settings.ollamaTranslationModel || settings.ollamaVisionModel,
          openRouterKey: settings.openRouterKey,
          openRouterModel: settings.openRouterModel
        };

        console.log('[ZenLens] Translation Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.translatedText) {
            setTranscripts(prev => {
              const updated = prev.map(t => 
                t.text === trimmedText 
                  ? { ...t, text: `${trimmedText}\n→ ${data.translatedText}` }
                  : t
              );
              return updated;
            });
          }
        } else {
          const errorData = await response.json();
          console.error('[ZenLens] Translation API Error:', errorData);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ZenLens] Translation failed:', errorMessage);
      }
    }
  }, [settings.engine, settings.sourceLanguage, settings.targetLanguage, settings.ollamaTranslationModel, settings.openRouterKey, settings.openRouterModel, lastProcessedText, lastProcessedTime]);

  if (!mounted) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "translator":
      case "scanner":
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
             <TranslationDisplay 
                text={transcripts.map(t => t.text).join('\n')}
                isScanning={isScanning}
                isStreamActive={isStreamActive}
                onCopy={(text) => navigator.clipboard.writeText(text)}
                onSpeak={(text) => {
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.lang = settings.targetLanguage;
                  window.speechSynthesis.speak(utterance);
                }}
                onSelectWindow={() => scannerRef.current?.selectWindow()}
                onUploadImage={() => scannerRef.current?.openFileUpload()}
                onDefineRegion={() => {}}
             />
             
             {/* Neural Feed Debug Box */}
             {!settings.isGameMode && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '100px', 
                  right: '32px',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  zIndex: 200
                }}>
                  <div style={{ fontSize: '0.6rem', color: '#71717a', marginBottom: '4px', fontWeight: 800 }}>NEURAL FEED</div>
                  <div id="vision-thumbnail-container" style={{ width: '120px', height: '60px', background: '#000', borderRadius: '4px', overflow: 'hidden' }} />
                </div>
             )}
          </div>
        );
      case "history":
        return (
          <div style={{ flex: 1, padding: '60px 80px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.02em' }}>History</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {transcripts.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', opacity: 0.3 }}>No recent transcripts.</div>
              ) : (
                transcripts.map(line => (
                  <div key={line.id} className="glass" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{line.text}</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(line.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case "settings":
        return (
          <div style={{ flex: 1, padding: '60px 80px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '40px', letterSpacing: '-0.04em' }}>Settings</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1200px' }}>
                <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>Vision Pipeline</h2>
                  <p style={{ color: '#a1a1aa' }}>Pipeline configuration is active via the footer tray.</p>
                </div>
              </div>
            </motion.div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#0a0a0b', overflow: 'hidden', position: 'relative' }}>
      <div className="glow-bg" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {!settings.isGameMode && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      <main style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {renderContent()}

        {activeTab === "translator" && (
          <div style={{ 
            position: 'absolute', 
            bottom: '32px', 
            left: 0, 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            pointerEvents: 'none',
            zIndex: 100
          }}>
            <div style={{ pointerEvents: 'auto' }}>
              <SettingsTray settings={settings} updateSettings={updateSettings} />
            </div>
          </div>
        )}

        <OCRScanner 
          ref={scannerRef}
          settings={settings}
          onTranscript={addTranscript} 
          isScanning={isScanning} 
          setIsScanning={setIsScanning} 
          sourceLanguage={settings.sourceLanguage}
          scanRegion={typeof settings.scanRegion === 'string' ? null : settings.scanRegion as unknown as { x: number, y: number, width: number, height: number }}
          setIsStreamActive={setIsStreamActive}
        />
      </main>

      <style jsx global>{`
        .glass {
          background: rgba(15, 15, 18, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
