"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

export interface ZenSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export default function ZenSelect({ label, value, options, onChange }: ZenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="zen-select-container" ref={containerRef} style={{ position: 'relative' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '0.7rem', 
        fontWeight: 900, 
        color: '#fff', 
        marginBottom: '6px', 
        letterSpacing: '0.15em',
        textShadow: '0 0 10px rgba(255,255,255,0.3)'
      }}>
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: 'pointer',
          minWidth: '140px',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 15px var(--accent-glow)' : 'none',
          borderColor: isOpen ? 'var(--accent)' : 'rgba(255,255,255,0.2)'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
          {selectedOption.label}
        </span>
        <ChevronDown size={14} color="#fff" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              width: '100%',
              marginBottom: '12px',
              background: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px',
              zIndex: 200,
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: option.value === value ? 'var(--accent)' : '#fff',
                  background: option.value === value ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = option.value === value ? 'rgba(255, 255, 255, 0.05)' : 'transparent')}
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
