"use client";

import { Trash2, Copy, Clock, History } from "lucide-react";
import { Translation } from "@/types";

interface HistorySidebarProps {
  history: Translation[];
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}

export default function HistorySidebar({ history, onDelete, onCopy }: HistorySidebarProps) {
  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <aside className="glass history-sidebar" style={{
      width: '320px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--card-border)',
      background: 'rgba(0,0,0,0.4)',
      overflowY: 'auto',
      borderRadius: '0'
    }}>
      <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={18} color="rgba(255,255,255,0.4)" />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>HISTORY</h3>
        </div>
        <button className="icon-btn-small" style={{ color: 'rgba(255,255,255,0.3)' }}><Clock size={16} /></button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {history.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.875rem' }}>
            <div style={{ marginBottom: '16px', opacity: 0.2 }}><History size={48} /></div>
            No translations yet
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="history-item" style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              transition: 'var(--transition-smooth)'
            }}>
              <p style={{ fontSize: '0.9375rem', marginBottom: '16px', lineHeight: '1.5', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                {item.translated}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onCopy(item.translated)} className="icon-btn-s"><Copy size={14} /></button>
                  <button onClick={() => onDelete(item.id)} className="icon-btn-s"><Trash2 size={14} /></button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                  {formatTime(item.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .history-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .icon-btn-s {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: 0.2s;
        }
        .icon-btn-s:hover {
          color: white;
          background: rgba(255,255,255,0.1);
          transform: scale(1.05);
        }
      `}</style>
    </aside>
  );
}
