"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Target, MousePointer2 } from "lucide-react";
import { ScanRegion } from "@/types";

interface RegionSelectorProps {
  videoStream: MediaStream | null;
  onConfirm: (region: ScanRegion) => void;
  onCancel: () => void;
}

export default function RegionSelector({ videoStream, onConfirm, onCancel }: RegionSelectorProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCurrentPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !containerRef.current) return;
    setIsDrawing(false);

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    // Convert to percentages for robust cross-resolution scaling
    if (width > 20 && height > 20) {
      onConfirm({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        width: (width / rect.width) * 100,
        height: (height / rect.height) * 100
      });
    }
  };

  const selectionRect = {
    x: Math.min(startPos.x, currentPos.x),
    y: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y)
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="region-selector-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="selector-container glass" onClick={(e) => e.stopPropagation()}>
        <div className="selector-header">
          <div className="header-info">
            <Target className="icon-pulse" size={20} color="var(--accent)" />
            <div>
              <h3>Define Scan Region</h3>
              <p>Drag the mouse over your game&apos;s dialogue area</p>
            </div>
          </div>
          <button onClick={onCancel} className="icon-btn-s"><X size={18} /></button>
        </div>

        <div 
          ref={containerRef}
          className="video-capture-area"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
        >
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }}
          />

          {isDrawing && (
            <div 
              className="selection-box"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height
              }}
            >
              <div className="selection-label">SCAN AREA</div>
            </div>
          )}

          {!isDrawing && selectionRect.width < 10 && (
             <div className="selection-hint fade-in">
                <MousePointer2 size={32} />
                <span>DRAG TO SELECT</span>
             </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .region-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 40px;
        }
        .selector-container {
          width: 100%;
          max-width: 1200px;
          height: 100%;
          max-height: 800px;
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .selector-header {
          padding: 24px 32px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-info { display: flex; gap: 16px; align-items: center; }
        .header-info h3 { font-size: 1.25rem; font-weight: 800; }
        .header-info p { font-size: 0.875rem; color: var(--foreground-dim); font-weight: 500; }
        
        .video-capture-area {
          flex: 1;
          position: relative;
          background: #000;
          user-select: none;
          overflow: hidden;
        }
        .selection-box {
          position: absolute;
          border: 2px solid var(--accent);
          background: rgba(0, 245, 212, 0.1);
          box-shadow: 0 0 40px rgba(0, 245, 212, 0.2);
          pointer-events: none;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 8px;
        }
        .selection-label {
          font-size: 10px;
          font-weight: 900;
          color: #000;
          background: var(--accent);
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.1em;
        }
        .selection-hint {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: rgba(255,255,255,0.2);
          font-weight: 900;
          letter-spacing: 0.2em;
          pointer-events: none;
        }
        .icon-pulse { animation: pulse 2s infinite alternate; }
        @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }
      `}</style>
    </motion.div>
  );
}
