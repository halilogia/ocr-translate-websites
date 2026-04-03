"use client";

import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import TranslationDisplay from "@/components/workspace/TranslationDisplay";
import SettingsTray from "@/components/panels/SettingsTray";
import OCRScanner, { OCRScannerRef } from "@/components/OCRScanner";
import ZenSelect from "@/components/ui/ZenSelect";
import { Translation, AppSettings } from "@/types";
import { motion } from "framer-motion";
import { Sparkles, Languages, Monitor, CloudUpload, Zap } from "lucide-react";

export default function Home() {
  const [history, setHistory] = useState<Translation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastTranslation, setLastTranslation] = useState<string>("");
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [activeTab, setActiveTab] = useState("translator");
  const scannerRef = useRef<OCRScannerRef>(null);

  const [settings, setSettings] = useState<AppSettings>({
    translationMode: true,
    sourceLanguage: 'eng',
    targetLanguage: 'tr',
    engine: 'google',
    autoScan: false,
    scanRegion: 'full',
    furigana: false,
    ollamaModel: 'llama3',
    openRouterKey: '',
    openRouterModel: 'neversleep/llama-3-lumimaid-8b:extended'
  });

  const handleTranscript = async (text: string) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          from: settings.sourceLanguage,
          to: settings.targetLanguage,
          engine: settings.engine,
          ollamaModel: settings.ollamaModel,
          openRouterKey: settings.openRouterKey,
          openRouterModel: settings.openRouterModel
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const translated = data.translatedText;
      
      setHistory(prev => [{
        id: Date.now().toString(),
        original: text,
        translated: translated,
        timestamp: Date.now(),
      }, ...prev].slice(0, 50));
      
      setLastTranslation(translated);
    } catch (err) {
      console.error('Home Translation Error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const deleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const speakText = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = settings.targetLanguage === 'tr' ? 'tr-TR' : 'en-US';
    window.speechSynthesis.speak(utter);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "translator":
      case "scanner":
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <TranslationDisplay 
              text={lastTranslation} 
              isScanning={isScanning} 
              isStreamActive={isStreamActive}
              onCopy={copyText} 
              onSpeak={speakText} 
              onSelectWindow={() => scannerRef.current?.selectWindow()}
              onUploadImage={() => scannerRef.current?.openFileUpload()}
            />
          </div>
        );
      case "history":
        return (
          <div style={{ flex: 1, padding: '60px 80px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.02em' }}>Translation History</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', opacity: 0.3 }}>No history items yet.</div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="glass fade-in" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{item.original}</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{item.translated}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <button onClick={() => copyText(item.translated)} className="icon-btn-s">Copy</button>
                       <button onClick={() => deleteHistory(item.id)} className="icon-btn-s red">Delete</button>
                    </div>
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
                <div className="glass settings-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={24} /> AI Provider
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <ZenSelect 
                      label="PRIMARY ENGINE"
                      value={settings.engine}
                      options={[
                        { value: 'google', label: 'Google Translate' },
                        { value: 'mymemory', label: 'MyMemory' },
                        { value: 'ollama', label: 'Ollama (Local)' },
                        { value: 'openrouter', label: 'OpenRouter' }
                      ]}
                      onChange={(val) => setSettings(prev => ({ ...prev, engine: val as any }))}
                    />

                    {settings.engine === 'ollama' && (
                      <div className="setting-field">
                        <label>OLLAMA MODEL</label>
                        <input 
                          className="settings-input"
                          placeholder="e.g. llama3"
                          value={settings.ollamaModel} 
                          onChange={(e) => setSettings(prev => ({ ...prev, ollamaModel: e.target.value }))} 
                        />
                      </div>
                    )}

                    {settings.engine === 'openrouter' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="setting-field">
                          <label>OPENROUTER API KEY</label>
                          <input 
                            type="password"
                            className="settings-input"
                            placeholder="sk-or-v1-..."
                            value={settings.openRouterKey} 
                            onChange={(e) => setSettings(prev => ({ ...prev, openRouterKey: e.target.value }))} 
                          />
                        </div>
                        <div className="setting-field">
                          <label>AI MODEL ID</label>
                          <input 
                            className="settings-input"
                            value={settings.openRouterModel} 
                            onChange={(e) => setSettings(prev => ({ ...prev, openRouterModel: e.target.value }))} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass settings-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Languages size={24} /> Regional
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <ZenSelect 
                      label="SOURCE LANGUAGE"
                      value={settings.sourceLanguage}
                      options={[
                        { value: 'eng', label: 'English' },
                        { value: 'jpn', label: 'Japanese' },
                        { value: 'kor', label: 'Korean' },
                        { value: 'tur', label: 'Turkish' }
                      ]}
                      onChange={(val) => setSettings(prev => ({ ...prev, sourceLanguage: val }))}
                    />
                    
                    <ZenSelect 
                      label="TARGET LANGUAGE"
                      value={settings.targetLanguage}
                      options={[
                        { value: 'tr', label: 'Turkish' },
                        { value: 'en', label: 'English' },
                        { value: 'de', label: 'German' }
                      ]}
                      onChange={(val) => setSettings(prev => ({ ...prev, targetLanguage: val }))}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <style jsx>{`
               .setting-field { display: flex; flex-direction: column; gap: 8px; }
               .setting-field label { 
                 font-size: 0.75rem; 
                 font-weight: 900; 
                 color: #fff; 
                 letter-spacing: 0.1em;
                 text-shadow: 0 0 10px rgba(255,255,255,0.2);
               }
               .settings-input {
                 background: rgba(255,255,255,0.08);
                 border: 2px solid rgba(255, 255, 255, 0.15);
                 padding: 14px 20px;
                 border-radius: 12px;
                 color: white;
                 outline: none;
                 font-size: 14px;
                 font-weight: 700;
                 transition: all 0.3s;
               }
               .settings-input:focus {
                 border-color: var(--accent);
                 background: rgba(255,255,255,0.12);
                 box-shadow: 0 0 20px var(--accent-glow);
               }
               .settings-card {
                 border-color: rgba(255,255,255,0.1);
                 box-shadow: 0 30px 60px rgba(0,0,0,0.5);
               }
            `}</style>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--background)', overflow: 'hidden', position: 'relative' }}>
      <div className="glow-bg" />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
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
            <SettingsTray 
              settings={settings} 
              updateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))} 
            />
          </div>
        )}

        <OCRScanner 
          ref={scannerRef}
          onTranscript={handleTranscript} 
          isScanning={isScanning} 
          setIsScanning={setIsScanning} 
          sourceLanguage={settings.sourceLanguage}
          setIsStreamActive={setIsStreamActive}
        />
      </main>
    </div>
  );
}
