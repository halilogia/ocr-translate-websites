"use client";

import { Volume2, Copy, Sparkles, Monitor, CloudUpload, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TranslationDisplayProps {
  text: string;
  isScanning: boolean;
  isStreamActive: boolean;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onSelectWindow: () => void;
  onUploadImage: () => void;
  onDefineRegion: () => void;
}

export default function TranslationDisplay({ 
  text, 
  isScanning, 
  isStreamActive,
  onCopy, 
  onSpeak, 
  onSelectWindow, 
  onUploadImage,
  onDefineRegion
}: TranslationDisplayProps) {
  const lines = text ? text.split('\n').filter(l => l.trim()) : [];

  return (
    <div className="translation-display" style={{
      flex: 1,
      padding: '60px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      overflowY: 'auto',
      position: 'relative',
      minHeight: '100%',
      background: 'rgba(0,0,0,0.1)'
    }}>
      <AnimatePresence mode="wait">
        {lines.length > 0 ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
          >
            {(isScanning || isStreamActive) && (
              <div style={{ position: 'absolute', top: '-48px', left: '0px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: 'var(--accent)', 
                    borderRadius: '50%',
                    boxShadow: '0 0 10px var(--accent-glow)',
                    animation: 'pulse-dot 1.5s infinite alternate'
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--foreground-dim)', letterSpacing: '0.2em' }}>
                    {isScanning ? 'ANALYZING...' : 'LIVE MONITORING'}
                  </span>
                </div>
                
                {!isScanning && (
                  <button 
                    onClick={onSelectWindow}
                    className="icon-btn-ghost" 
                    title="Force Scan Now"
                    style={{ padding: '4px', opacity: 0.5 }}
                  >
                    <Sparkles size={16} color="var(--accent)" />
                  </button>
                )}
              </div>
            )}

            {lines.map((line, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="translation-row" 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px'
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '2rem', lineHeight: '1', fontWeight: 300, marginTop: '8px' }}>—</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h2 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    lineHeight: '1.2', 
                    color: 'white'
                  }}>
                    {line}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', opacity: 0.4 }} className="row-actions">
                    <button onClick={() => onSpeak(line)} className="icon-btn-ghost"><Volume2 size={24} /></button>
                    <button onClick={() => onCopy(line)} className="icon-btn-ghost"><Copy size={24} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : isStreamActive ? (
          <motion.div 
            key="monitoring"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              textAlign: 'center',
              gap: '40px'
            }}
          >
            <div className="pulse-icon" style={{ 
              width: '140px', 
              height: '140px', 
              background: 'rgba(0, 245, 212, 0.05)',
              border: '2px solid rgba(0, 245, 212, 0.2)',
              borderRadius: '35px',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 60px rgba(0, 245, 212, 0.1)'
            }}>
              <Monitor size={54} color="var(--accent)" />
            </div>
            
            <div style={{ maxWidth: '450px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Ghost Mode Active
              </h2>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '1.15rem', lineHeight: 1.6, fontWeight: 500 }}>
                ZenLens is silently monitoring your game window. <br/>
                Translations will appear here instantly when text is detected.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              <button 
                onClick={onSelectWindow}
                className="glass hover-glow"
                style={{ padding: '16px 32px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}
              >
                Change Window
              </button>
              <button 
                onClick={onDefineRegion}
                className="glass hover-glow"
                style={{ 
                  padding: '16px 32px', 
                  borderRadius: '16px', 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  background: 'rgba(0, 245, 212, 0.1)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Target size={18} />
                Define Scan Region
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              textAlign: 'center',
              gap: '24px'
            }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #00f5d4, #7209b7)',
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 10px 30px rgba(114, 9, 183, 0.4)'
            }}>
              <Zap size={40} color="white" />
            </div>
            <div style={{ maxWidth: '500px' }}>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.04em' }}>Welcome to ZenLens</h1>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '1.25rem', lineHeight: 1.6, fontWeight: 500 }}>
                The ultimate tool for real-time game translation. Select a source to begin your experience.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%', maxWidth: '640px', marginTop: '32px' }}>
              <button 
                onClick={onSelectWindow}
                className="glass hover-glow" 
                style={{ 
                  padding: '40px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '20px', 
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ width: '48px', height: '48px', background: 'rgba(0, 245, 212, 0.1)', borderRadius: '12px', display: 'grid', placeItems: 'center' }}>
                  <Monitor size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Capture Window</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--foreground-dim)', fontWeight: 500 }}>Select a game or app window for real-time translation.</p>
                </div>
              </button>

              <button 
                onClick={onUploadImage}
                className="glass hover-glow" 
                style={{ 
                  padding: '40px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '20px', 
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ width: '48px', height: '48px', background: 'rgba(0, 245, 212, 0.1)', borderRadius: '12px', display: 'grid', placeItems: 'center' }}>
                  <CloudUpload size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Upload Image</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--foreground-dim)', fontWeight: 500 }}>Scan a specific screenshot or local image file.</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pulse-icon {
          animation: pulse-monitoring 2s infinite alternate;
        }
        @keyframes pulse-monitoring {
          from { border-color: rgba(0, 245, 212, 0.2); box-shadow: 0 0 40px rgba(0, 245, 212, 0.05); }
          to { border-color: rgba(0, 245, 212, 0.5); box-shadow: 0 0 80px rgba(0, 245, 212, 0.15); }
        }
        .row-actions:hover {
          opacity: 1 !important;
        }
        .icon-btn-ghost {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: grid;
          place-items: center;
          transition: 0.2s;
        }
        .icon-btn-ghost:hover {
          transform: scale(1.1);
          color: var(--accent);
        }
        @keyframes pulse-dot {
          from { opacity: 0.4; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
