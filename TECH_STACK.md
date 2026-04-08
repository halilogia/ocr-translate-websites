# ZenLens Technical Architecture

This document outlines the technical decisions and architecture behind ZenLens.

## Core Services

### 1. OCR Engines

ZenLens employs a dual-engine strategy for Optical Character Recognition:

- **TesseractProvider (`src/services/TesseractProvider.ts`)**: 
  - Uses `tesseract.js`.
  - Runs entirely in the browser.
  - Best for: Simple, high-contrast text, screenshots of clean documents.
  - Pros: Instant, no server requirements, works offline.
  
- **AetherProvider (`src/services/AetherProvider.ts`)**:
  - Orchestrates requests to a local **Ollama** instance.
  - Utilizes vision models like `llava`, `bakllava`, or `moondream`.
  - Best for: Complex layouts, handwritten text, low-quality images, or when context-aware recognition is needed.
  - Pros: Extreme accuracy, state-of-the-art AI.

### 2. Translation Layer
- **Component-based logic**: Translation is handled in `src/components/Translator.tsx`.
- **Provider**: Currently utilizes the **MyMemory API**, which offers a generous free tier and doesn't require complex API key management for basic use.
- **Future-proofing**: The architecture is designed to easily swap in OpenAI or Google Cloud Translation if needed.

## UI/UX Framework

### Design System
- **Dark Mode First**: The application uses a custom dark theme defined via CSS variables in `src/app/globals.css`.
- **Glassmorphism**: Extensive use of `backdrop-filter: blur()` and semi-transparent backgrounds to create a modern, premium feel.
- **Micro-animations**: `framer-motion` is used for entry animations, layout transitions, and interactive states.

### Key Components
- **ZenLensApp**: The main layout wrapper managing state between OCR and Translation.
- **OCRScanner**: Handles image uploads and engine selection.
- **CaptureLogic**: Manages the screen capture/selection overlay.

## Performance Optimization
- **Next.js 16 Features**: Utilizing the latest App Router optimizations for faster server-side rendering and client-side navigation.
- **Debounced Processing**: Translation requests are debounced to avoid hitting API rate limits during typing.
- **Image handling**: Efficient base64 processing for local AI inference.

---

*This document is maintained by the ZenLens core team.*
