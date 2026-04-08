# 👁️ ZenLens: OCR & Website Translator

ZenLens is a high-performance, aesthetically pleasing web application designed to capture, recognize, and translate text from any website or image. Built with Next.js 16 and React 19, it combines browser-native OCR with local AI vision capabilities.

![ZenLens Banner](https://raw.githubusercontent.com/halilogia/ocr-translate-websites/main/public/banner.png) *(Placeholder for your banner)*

## ✨ Features

- **🚀 Hybrid OCR Engine**: 
  - **Tesseract.js**: Fast, browser-side text recognition for standard tasks.
  - **Aether Vision (Ollama)**: High-fidelity OCR using local AI models (Llava, Bakllava) for complex layouts.
- **🌍 Instant Translation**: seamlessly translate English text to Turkish (and more) using the MyMemory API.
- **📸 Intelligent Capture**: Built-in logic to capture specific areas of a website or uploaded images.
- **🎨 Glassmorphic UI**: A premium, dark-mode interface with smooth animations powered by Framer Motion.
- **⚡ Local-First**: Your data stays on your machine when using the Ollama engine.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Library**: [React 19](https://react.dev/)
- **Styling**: Vanilla CSS with CSS Variables (Glassmorphism)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/) & [Ollama API](https://ollama.ai/)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- [Ollama](https://ollama.ai/) (required for Aether AI OCR)
  - Run the following to prepare the vision model:
    ```bash
    ollama run llava
    ```

### Environment Variables

If you want to use external translation/OCR engines without entering keys every time, you can set them in a `.env.local` file:

```env
OPENROUTER_API_KEY=your_key_here
OCR_API_KEY=your_key_here
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
```

See `.env.example` for details.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/halilogia/ocr-translate-websites.git
   cd ocr-translate-websites
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Visit the app**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **OCR Scanning**: Select "OCR Scanner" from the sidebar. Upload an image or use the capture tool to select text.
2. **AI Vision**: Toggle the "Aether" engine to use your local Ollama instance for better accuracy in complex images.
3. **Translation**: Recognized text is automatically synced to the Translator, providing instant Turkish equivalents.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Developed with ❤️ by [Halilogia](https://github.com/halilogia)
