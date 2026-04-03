import { useState, useEffect } from "react";
import ZenSelect from "@/components/ui/ZenSelect";
import { AppSettings } from "@/types";

interface SettingsTrayProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export default function SettingsTray({ settings, updateSettings }: SettingsTrayProps) {
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
      padding: '20px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      zIndex: 100,
      background: 'rgba(5, 5, 5, 0.95)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '24px',
      backdropFilter: 'blur(60px) saturate(200%)',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9)',
      width: 'fit-content',
      pointerEvents: 'auto'
    }}>
      {/* ROW 1: TRANSLATION SETTINGS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <ZenSelect 
            label="SOURCE"
            value={settings.sourceLanguage}
            options={sourceOptions}
            onChange={(val) => updateSettings({ sourceLanguage: val })}
          />

          <div style={{ color: '#fff', fontSize: '14px', opacity: 0.5, fontWeight: 900, height: '40px', display: 'grid', placeItems: 'center' }}>→</div>

          <ZenSelect 
            label="TARGET"
            value={settings.targetLanguage}
            options={targetOptions}
            onChange={(val) => updateSettings({ targetLanguage: val })}
          />
        </div>

        <div style={{ height: '32px', width: '2px', background: 'rgba(255, 255, 255, 0.1)', marginTop: '20px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <ZenSelect 
            label="TL ENGINE"
            value={settings.engine}
            options={engineOptions}
            onChange={(val) => updateSettings({ engine: val as any })}
          />
          {settings.engine === 'ollama' && (
            ollamaOptions.length > 0 ? (
              <ZenSelect 
                label="OLLAMA MODEL"
                value={settings.ollamaModel}
                options={ollamaOptions}
                onChange={(val) => updateSettings({ ollamaModel: val })}
              />
            ) : (
              <input 
                className="minimal-input"
                placeholder="Model: llama3" 
                value={settings.ollamaModel || ''} 
                onChange={(e) => updateSettings({ ollamaModel: e.target.value })}
              />
            )
          )}
          {settings.engine === 'openrouter' && (
            <input 
              type="password"
              className="minimal-input"
              placeholder="OpenRouter API Key" 
              value={settings.openRouterKey || ''} 
              onChange={(e) => updateSettings({ openRouterKey: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* ROW 2: VISION SETTINGS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <ZenSelect 
            label="VISION ENGINE (OCR)"
            value={settings.ocrEngine}
            options={ocrOptions}
            onChange={(val) => updateSettings({ ocrEngine: val as any })}
          />
          {settings.ocrEngine === 'ollama' && (
            ollamaOptions.length > 0 ? (
              <ZenSelect 
                label="OLLAMA VISION MODEL"
                value={settings.ollamaVisionModel}
                options={ollamaOptions}
                onChange={(val) => updateSettings({ ollamaVisionModel: val })}
              />
            ) : (
              <input 
                className="minimal-input"
                placeholder="Vision: llava" 
                value={settings.ollamaVisionModel || ''} 
                onChange={(e) => updateSettings({ ollamaVisionModel: e.target.value })}
              />
            )
          )}
          {settings.ocrEngine === 'ocrspace' && (
            <input 
              type="password"
              className="minimal-input"
              placeholder="OCR.space API Key" 
              value={settings.ocrApiKey || ''} 
              onChange={(e) => updateSettings({ ocrApiKey: e.target.value })}
            />
          )}
        </div>
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
