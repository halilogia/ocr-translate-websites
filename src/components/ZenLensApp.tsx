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
  sourceLanguage: 'eng',
  targetLanguage: 'tr',
  engine: 'google',
  ocrEngine: 'tesseract',
  autoScan: false,
  scanRegion: null, // null = full screen
  furigana: false,
  ollamaModel: '',
  ollamaVisionModel: '',
  ollamaTranslationModel: '',
  openRouterKey: '',
  openRouterModel: '',
  ocrApiKey: '',
  isGameMode: false
};

// Helper function to load settings from localStorage
function loadInitialSettings(): AppSettings {
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
  
  return initialSettings;
}

export default function ZenLensApp() {
  const [activeTab, setActiveTab] = useState("translator");
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);
  const [isScanning, setIsScanning] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<OCRScannerRef | null>(null);
  const isMountedRef = useRef(false);

  // Track mounted state via ref (no setState call)
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('zenlens-v1-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleSelectRegion = useCallback(() => {
    if (isStreamActive) {
      setIsSelectingRegion(true);
    } else {
      alert("Please start screen sharing first by clicking 'CHANGE WINDOW'");
    }
  }, [isStreamActive]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelectingRegion || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [isSelectingRegion]);

  const handleMouseUp = useCallback(() => {
    if (!isSelectingRegion || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    if (width > 20 && height > 20) {
      updateSettings({
        scanRegion: {
          x: (x / rect.width) * 100,
          y: (y / rect.height) * 100,
          width: (width / rect.width) * 100,
          height: (height / rect.height) * 100
        }
      });
    }
    
    setIsSelectingRegion(false);
  }, [isSelectingRegion, selectionStart, selectionEnd, updateSettings]);

  const clearRegion = useCallback(() => {
    updateSettings({ scanRegion: null });
  }, [updateSettings]);

  const [lastProcessedText, setLastProcessedText] = useState<string>('');
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0);
  const transcriptHistoryRef = useRef<string[]>([]);
  const hasRunRef = useRef(false);

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
    
    // Prevent double execution from React StrictMode
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    setTimeout(() => { hasRunRef.current = false; }, 100);
    
    const trimmedText = text.trim();
    const now = Date.now();
    
    // 1. Exact duplicate check
    if (trimmedText === lastProcessedText) return;
    
    // 2. Similarity check within 10 seconds
    if (lastProcessedText && (now - lastProcessedTime < 10000)) {
      const similarity = textSimilarity(trimmedText, lastProcessedText);
      if (similarity > 0.85) return;
    }
    
    // 3. History check
    const isDuplicate = transcriptHistoryRef.current.some(existingText => {
      return textSimilarity(trimmedText, existingText) > 0.9;
    });
    if (isDuplicate) return;
    
    // Update tracking
    setLastProcessedText(trimmedText);
    setLastProcessedTime(now);
    transcriptHistoryRef.current = [...transcriptHistoryRef.current, trimmedText].slice(-20);
    
    // ONLY fetch translation and store it (no original text)
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

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.translatedText) {
            // Store both original and translated text
            setTranscripts(prev => {
              const newLine: TranscriptLine = {
                id: Date.now().toString(),
                text: data.translatedText,
                originalText: trimmedText,
                timestamp: now
              };
              return [...prev, newLine].slice(-10);
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
  }, [lastProcessedText, lastProcessedTime, settings.engine, settings.sourceLanguage, settings.targetLanguage, settings.ollamaTranslationModel, settings.ollamaVisionModel, settings.openRouterKey, settings.openRouterModel]);

  // SSR safety: loadInitialSettings handles localStorage check
  // No need to block render since we're in a "use client" component

  const renderContent = () => {
    switch (activeTab) {
      case "translator":
      case "scanner":
        const latestTranscript = transcripts.length > 0 ? transcripts[transcripts.length - 1] : null;
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
             <TranslationDisplay 
                text={latestTranscript ? latestTranscript.text : ''}
                originalText={latestTranscript?.originalText}
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
                onDefineRegion={() => {
                  // Simple region definition: prompt user for coordinates
                  const x = prompt('Enter X coordinate (0-100):', '0');
                  const y = prompt('Enter Y coordinate (0-100):', '0');
                  const w = prompt('Enter Width (0-100):', '100');
                  const h = prompt('Enter Height (0-100):', '100');
                  if (x !== null && y !== null && w !== null && h !== null) {
                    updateSettings({
                      scanRegion: {
                        x: parseInt(x) || 0,
                        y: parseInt(y) || 0,
                        width: parseInt(w) || 100,
                        height: parseInt(h) || 100
                      } as unknown as AppSettings['scanRegion']
                    });
                  }
                }}
                onToggleHistory={() => setShowHistory(!showHistory)}
                historyCount={transcripts.length}
             />
             
             {/* History Panel */}
             <motion.div
               initial={{ x: 400 }}
               animate={{ x: showHistory ? 0 : 400 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               style={{
                 position: 'absolute',
                 top: 0,
                 right: 0,
                 width: '380px',
                 height: '100%',
                 background: 'rgba(10, 10, 12, 0.95)',
                 borderLeft: '1px solid rgba(255,255,255,0.1)',
                 backdropFilter: 'blur(20px)',
                 zIndex: 150,
                 display: 'flex',
                 flexDirection: 'column',
                 overflow: 'hidden'
               }}
             >
               <div style={{ 
                 padding: '20px 24px', 
                 borderBottom: '1px solid rgba(255,255,255,0.1)',
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center'
               }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em' }}>HISTORY</h3>
                 <button 
                   onClick={() => setShowHistory(false)}
                   style={{ 
                     background: 'rgba(255,255,255,0.1)', 
                     border: 'none', 
                     color: 'white', 
                     cursor: 'pointer',
                     padding: '6px 10px',
                     borderRadius: '8px',
                     fontSize: '12px'
                   }}
                 >✕</button>
               </div>
               <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                 {transcripts.length === 0 ? (
                   <div style={{ textAlign: 'center', opacity: 0.3, padding: '40px', fontSize: '14px' }}>No history yet</div>
                 ) : (
                   [...transcripts].reverse().map((line) => (
                     <div 
                       key={line.id} 
                       style={{ 
                         padding: '16px', 
                         marginBottom: '12px',
                         background: 'rgba(255,255,255,0.03)',
                         borderRadius: '12px',
                         border: '1px solid rgba(255,255,255,0.05)'
                       }}
                     >
                       <p style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '8px' }}>{line.text}</p>
                       <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{new Date(line.timestamp).toLocaleTimeString()}</span>
                     </div>
                   ))
                 )}
               </div>
             </motion.div>
             
             {/* Neural Feed Debug Box */}
             {!settings.isGameMode && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '100px', 
                  right: showHistory ? '400px' : '32px',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  zIndex: 200,
                  transition: 'right 0.3s'
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
              <SettingsTray 
                settings={settings} 
                updateSettings={updateSettings} 
                onSelectWindow={() => scannerRef.current?.selectWindow()}
                onSelectRegion={handleSelectRegion}
              />
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
          scanRegion={settings.scanRegion}
          setIsStreamActive={setIsStreamActive}
        />

        {/* Region Selection Overlay */}
        {isSelectingRegion && (
          <div
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              cursor: 'crosshair',
              background: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Selection rectangle */}
            {selectionStart.x !== selectionEnd.x || selectionStart.y !== selectionEnd.y ? (
              <div style={{
                position: 'absolute',
                left: Math.min(selectionStart.x, selectionEnd.x),
                top: Math.min(selectionStart.y, selectionEnd.y),
                width: Math.abs(selectionEnd.x - selectionStart.x),
                height: Math.abs(selectionEnd.y - selectionStart.y),
                border: '2px solid #a855f7',
                background: 'rgba(168, 85, 247, 0.2)',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: -25,
                  left: 0,
                  background: '#a855f7',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  SCAN REGION - Release mouse to confirm
                </div>
              </div>
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 700,
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}>
                <div style={{ marginBottom: '10px' }}> Drag to select scan region</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Release mouse to confirm</div>
              </div>
            )}
            
            {/* Cancel button */}
            <button
              onClick={() => setIsSelectingRegion(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* Region indicator */}
        {settings.scanRegion && !isSelectingRegion && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '20px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#a855f7',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📐 Region Active</span>
            <button
              onClick={clearRegion}
              style={{
                background: 'rgba(239, 68, 68, 0.3)',
                border: 'none',
                color: '#ef4444',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              Clear
            </button>
          </div>
        )}
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
