"use client";

import { Home, Scan, History, Settings, ChevronLeft, ChevronRight, LogOut, Zap } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "translator", label: "Translator", icon: Home },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="glass" style={{
      width: isCollapsed ? '72px' : '240px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 100,
      borderRight: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '48px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 4px 12px var(--accent-glow)'
        }}>
          <Zap size={18} color="white" />
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: '12px',
              width: isCollapsed ? '48px' : '100%',
              border: 'none',
              borderRadius: '12px',
              background: activeTab === item.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: activeTab === item.id ? 'var(--accent)' : 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {activeTab === item.id && (
              <div style={{ position: 'absolute', left: '0', width: '3px', height: '100%', background: 'var(--accent)' }} />
            )}
            <item.icon size={20} />
            {!isCollapsed && <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.2)',
            cursor: 'pointer'
          }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <style jsx>{`
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: white !important;
        }
      `}</style>
    </aside>
  );
}
