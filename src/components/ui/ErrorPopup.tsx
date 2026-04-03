"use client";

import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ErrorPopupProps {
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
}

export default function ErrorPopup({ title, message, details, onClose }: ErrorPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        exit={{ opacity: 0, y: -50, x: "-50%" }}
        style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          maxWidth: "600px",
          width: "90%"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 20px 60px rgba(239, 68, 68, 0.4)",
            backdropFilter: "blur(20px)",
            color: "white"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: "2px" }} />
            
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", opacity: 0.9, lineHeight: 1.5 }}>
                {message}
              </p>
              {details && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    lineHeight: 1.6,
                    maxHeight: "150px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {details}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
