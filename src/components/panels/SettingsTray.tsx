import ZenSelect from "@/components/ui/ZenSelect";
import { AppSettings } from "@/types";

interface SettingsTrayProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export default function SettingsTray({ settings, updateSettings }: SettingsTrayProps) {
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
    { value: 'google', label: 'Google Translate' },
    { value: 'mymemory', label: 'MyMemory' },
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'openrouter', label: 'OpenRouter' },
  ];

  return (
    <div className="glass settings-tray fade-in" style={{
      padding: '16px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      zIndex: 100,
      background: 'rgba(5, 5, 5, 0.95)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      backdropFilter: 'blur(60px) saturate(200%)',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9)',
      width: 'fit-content',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <ZenSelect 
            label="SOURCE"
            value={settings.sourceLanguage}
            options={sourceOptions}
            onChange={(val) => updateSettings({ sourceLanguage: val })}
          />

          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 900, height: '40px', display: 'grid', placeItems: 'center' }}>→</div>

          <ZenSelect 
            label="TARGET"
            value={settings.targetLanguage}
            options={targetOptions}
            onChange={(val) => updateSettings({ targetLanguage: val })}
          />
        </div>

        <div style={{ height: '32px', width: '2px', background: 'rgba(255, 255, 255, 0.2)', marginTop: '20px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <ZenSelect 
            label="ENGINE"
            value={settings.engine}
            options={engineOptions}
            onChange={(val) => updateSettings({ engine: val as any })}
          />
        </div>

        {(settings.engine === 'ollama' || settings.engine === 'openrouter') && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            {settings.engine === 'ollama' && (
              <input 
                className="minimal-input"
                placeholder="Model: llama3" 
                value={settings.ollamaModel || ''} 
                onChange={(e) => updateSettings({ ollamaModel: e.target.value })}
              />
            )}
            {settings.engine === 'openrouter' && (
              <input 
                type="password"
                className="minimal-input"
                placeholder="API Key" 
                value={settings.openRouterKey || ''} 
                onChange={(e) => updateSettings({ openRouterKey: e.target.value })}
              />
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .minimal-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          outline: none;
          width: 160px;
          transition: 0.3s;
          height: 40px;
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
