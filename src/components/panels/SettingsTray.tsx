import { useState, useEffect } from "react";
import ZenSelect from "@/components/ui/ZenSelect";
import { AppSettings } from "@/types";

interface SettingsTrayProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectWindow?: () => void;
  onSelectRegion?: () => void;
}

export default function SettingsTray({ settings, updateSettings, onSelectWindow, onSelectRegion }: SettingsTrayProps) {
  const [ollamaOptions, setOllamaOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/ollama/models');
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setOllamaOptions(data.models.map((m: string) => ({ value: m, label: m.toUpperCase() })));
        }
      } catch (err: unknown) {
        console.warn("[ZenLens] Settings: Ollama check failed", err);
      }
    };
    fetchModels();
  }, []);

  const sourceOptions = [
    { value: 'eng', label: 'English' },
    { value: 'jpn', label: 'Japanese' },
    { value: 'kor', label: 'Korean' },
    { value: 'tur', label: 'Turkish' },
  ];

  const targetOptions = [
    { value: 'tr', label: 'Turkish' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'German' },
  ];

  const engineOptions = [
    { value: 'google', label: 'Google' },
    { value: 'mymemory', label: 'MyMemory' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'openrouter', label: 'OpenRouter' },
  ];

  const ocrOptions = [
    { value: 'tesseract', label: 'Local (Tesseract)' },
    { value: 'ollama', label: 'Aether (Ollama)' },
    { value: 'ocrspace', label: 'Pro (OCR.space)' },
  ];

  return (
    <div className="glass settings-tray fade-in" style={{
      padding: '12px 24px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '24px',
      zIndex: 100,
      background: 'rgba(5, 5, 5, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      backdropFilter: 'blur(60px) saturate(200%)',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9)',
      width: 'fit-content',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <ZenSelect 
          label="SOURCE"
          value={settings.sourceLanguage}
          options={sourceOptions}
          onChange={(val) => updateSettings({ sourceLanguage: val })}
        />

        <div style={{ color: '#fff', fontSize: '14px', opacity: 0.3, fontWeight: 900 }}>→</div>

        <ZenSelect 
          label="TARGET"
          value={settings.targetLanguage}
          options={targetOptions}
          onChange={(val) => updateSettings({ targetLanguage: val })}
        />

        <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

        <ZenSelect 
          label="TRANSLATE ENGINE"
          value={settings.engine}
          options={engineOptions}
          onChange={(val) => updateSettings({ engine: val as AppSettings['engine'] })}
        />

        <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

        <ZenSelect 
          label="VISION"
          value={settings.ocrEngine}
          options={ocrOptions}
          onChange={(val) => updateSettings({ ocrEngine: val as AppSettings['ocrEngine'] })}
        />

        {settings.ocrEngine === 'ollama' && (
          ollamaOptions.length > 0 ? (
            <ZenSelect 
              label="VISION MODEL"
              value={settings.ollamaVisionModel}
              options={ollamaOptions}
              onChange={(val) => updateSettings({ ollamaVisionModel: val })}
            />
          ) : (
            <input 
              className="minimal-input"
              placeholder="Vision Model: translategemma" 
              value={settings.ollamaVisionModel || ''} 
              onChange={(e) => updateSettings({ ollamaVisionModel: e.target.value })}
            />
          )
        )}

        {settings.engine === 'ollama' && (
          ollamaOptions.length > 0 ? (
            <ZenSelect 
              label="TRANSLATE MODEL"
              value={settings.ollamaTranslationModel}
              options={ollamaOptions}
              onChange={(val) => updateSettings({ ollamaTranslationModel: val })}
            />
          ) : (
            <input 
              className="minimal-input"
              placeholder="Translate Model: translategemma" 
              value={settings.ollamaTranslationModel || ''} 
              onChange={(e) => updateSettings({ ollamaTranslationModel: e.target.value })}
            />
          )
        )}

        {settings.engine === 'openrouter' && (
          <input 
            type="password"
            className="minimal-input"
            placeholder="OpenRouter Key" 
            value={settings.openRouterKey || ''} 
            onChange={(e) => updateSettings({ openRouterKey: e.target.value })}
          />
        )}

        <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {onSelectWindow && (
          <button
            onClick={onSelectWindow}
            style={{
              background: 'rgba(0, 245, 212, 0.1)',
              border: '1px solid rgba(0, 245, 212, 0.3)',
              borderRadius: '12px',
              padding: '8px 16px',
              color: '#00f5d4',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              whiteSpace: 'nowrap'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            CHANGE WINDOW
          </button>
        )}

        {onSelectRegion && (
          <button
            onClick={onSelectRegion}
            style={{
              background: settings.scanRegion ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: settings.scanRegion ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '8px 16px',
              color: settings.scanRegion ? '#a855f7' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              whiteSpace: 'nowrap'
            }}
            title="Ekranda OCR taraması yapılacak bölgeyi seçin"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>
            </svg>
            {settings.scanRegion ? 'REGION SET' : 'SELECT REGION'}
          </button>
        )}

        <button
          onClick={() => updateSettings({ autoDetectRegions: !settings.autoDetectRegions })}
          style={{
            background: settings.autoDetectRegions ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: settings.autoDetectRegions ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '8px 16px',
            color: settings.autoDetectRegions ? '#22c55e' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '42px',
            whiteSpace: 'nowrap'
          }}
          title="Otomatik olarak ekrandaki metin bölgelerini tespit eder ve sadece o alanları OCR ile tarar"
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: settings.autoDetectRegions ? '#22c55e' : 'rgba(255, 255, 255, 0.3)'
          }} />
          AUTO-REGIONS
        </button>
      </div>

      <style jsx>{`
        .minimal-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          outline: none;
          width: 180px;
          transition: 0.3s;
          height: 42px;
        }
        .minimal-input:focus {
          border-color: var(--accent);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 10px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}
