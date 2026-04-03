"use client";

import { Copy, Trash2, Volume2, Sparkles, Languages } from "lucide-react";
import { useState, useEffect } from "react";

interface TranslatorProps {
  initialText?: string;
}

export default function Translator({ initialText = "" }: TranslatorProps) {
  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const translateText = async (text: string) => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }

    setIsLoading(true);
    try {
      // Using MyMemory translation API (free, no key needed for basic usage)
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tr`);
      const data = await res.json();
      setTranslatedText(data.responseData.translatedText);
      
      // Save to history (simulation)
      const history = JSON.parse(localStorage.getItem('translation-history') || '[]');
      const newEntry = { id: Date.now(), en: text, tr: data.responseData.translatedText, date: new Date().toISOString() };
      localStorage.setItem('translation-history', JSON.stringify([newEntry, ...history].slice(0, 20)));

    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced translation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText) translateText(inputText);
    }, 800);

    return () => clearTimeout(timer);
  }, [inputText]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearAll = () => {
    setInputText("");
    setTranslatedText("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>Text Translator</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>Fast & accurate English to Turkish translation</p>
        </div>
        
        <div className="glass" style={{ display: 'flex', gap: '8px', padding: '6px' }}>
          <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent)', fontWeight: 600 }}>English</div>
          <div style={{ padding: '8px', display: 'grid', placeItems: 'center' }}><Languages size={18} /></div>
          <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent)', fontWeight: 600 }}>Turkish</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1, minHeight: '400px' }}>
        {/* Input Panel */}
        <div className="glass section" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={clearAll} className="icon-btn" title="Clear"><Trash2 size={18} /></button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste English text here..."
            className="input-area"
          />
          <div style={{ marginTop: 'auto', padding: '16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>{inputText.length} / 5000</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => copyToClipboard(inputText)} className="icon-btn"><Copy size={18} /></button>
              <button className="icon-btn"><Volume2 size={18} /></button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="glass section" style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
            {isLoading && <Sparkles className="spinning" size={18} color="var(--accent)" />}
          </div>
          <div className={`output-area ${isLoading ? 'loading' : ''}`}>
            {translatedText || (isLoading ? "Translating..." : <span style={{ color: 'rgba(255,255,255,0.2)' }}>Turkish translation will appear here...</span>)}
          </div>
          <div style={{ marginTop: 'auto', padding: '16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => copyToClipboard(translatedText)} className="icon-btn"><Copy size={18} /></button>
              <button className="icon-btn"><Volume2 size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .section {
          transition: var(--transition-smooth);
        }
        .section:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .input-area {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 24px;
          font-size: 1.125rem;
          line-height: 1.6;
          resize: none;
          outline: none;
          scrollbar-width: thin;
        }
        .output-area {
          flex: 1;
          padding: 24px;
          font-size: 1.125rem;
          line-height: 1.6;
          color: var(--accent);
          overflow-y: auto;
          white-space: pre-wrap;
          transition: opacity 0.2s ease;
        }
        .output-area.loading {
          opacity: 0.6;
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: var(--transition-smooth);
        }
        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-2px);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
