"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// [ZenLens 30.4] Atomic Hydration Fix:
// Force the entire application to only render on the client side.
const ZenLensApp = dynamic(() => import('../components/ZenLensApp'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      background: '#0a0a0b', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: '#3b82f6',
      fontSize: '0.8rem',
      fontWeight: 600,
      letterSpacing: '0.2em'
    }}>
      INITIALIZING VISION...
    </div>
  )
});

export default function Home() {
  return <ZenLensApp />;
}
