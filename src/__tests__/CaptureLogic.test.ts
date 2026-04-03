import { CaptureService } from "@/components/CaptureLogic";

jest.mock("tesseract.js", () => ({
  createWorker: jest.fn().mockImplementation(() => ({
    recognize: jest.fn().mockResolvedValue({
      data: { text: "Hello World", confidence: 90 }
    }),
    terminate: jest.fn().mockResolvedValue(null)
  }))
}));

jest.mock("@/services/AetherProvider", () => ({
  AetherProvider: {
    performOCR: jest.fn().mockResolvedValue({ text: "AI Result", confidence: 100 })
  }
}));

jest.mock("@/services/TesseractProvider", () => ({
  TesseractProvider: {
    performOCR: jest.fn().mockResolvedValue({ text: "Hello World", confidence: 90 })
  }
}));

describe("CaptureService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("performOCR should return text and confidence", async () => {
    const mockSettings = {
      ocrEngine: 'tesseract' as const,
      sourceLanguage: 'eng',
      ollamaVisionModel: '',
      translationMode: false,
      targetLanguage: 'en',
      engine: 'google' as const,
      autoScan: false,
      scanRegion: 'full' as const,
      furigana: false,
      ollamaModel: '',
      openRouterKey: '',
      openRouterModel: '',
      ocrApiKey: ''
    };
    const result = await CaptureService.performOCR("data:image/png;base64,mock", mockSettings);
    expect(result.text).toBe("Hello World");
    expect(result.confidence).toBe(90);
  });

  test("captureFrame should return black frame for invalid video", () => {
    const mockVideo = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
    const mockCanvas = {
      getContext: jest.fn().mockReturnValue(null)
    } as unknown as HTMLCanvasElement;
    const result = CaptureService.captureFrame(mockVideo, mockCanvas);
    expect(result.isBlack).toBe(true);
    expect(result.dataUrl).toBe("");
  });

  test("performOCR should return empty for invalid image source", async () => {
    const mockSettings = {
      ocrEngine: 'tesseract' as const,
      sourceLanguage: 'eng',
      ollamaVisionModel: '',
      translationMode: false,
      targetLanguage: 'en',
      engine: 'google' as const,
      autoScan: false,
      scanRegion: 'full' as const,
      furigana: false,
      ollamaModel: '',
      openRouterKey: '',
      openRouterModel: '',
      ocrApiKey: ''
    };
    const result = await CaptureService.performOCR("", mockSettings);
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
  });

  test("captureFrame should detect black frames correctly", () => {
    const mockVideo = {
      videoWidth: 100,
      videoHeight: 100,
      srcObject: {}
    } as HTMLVideoElement;
    
    const mockContext = {
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(1600).fill(0)
      }),
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: undefined
    };
    
    const mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
      width: 0,
      height: 0,
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,mock")
    } as unknown as HTMLCanvasElement;
    
    const result = CaptureService.captureFrame(mockVideo, mockCanvas);
    expect(result.isBlack).toBe(true);
  });

  test("captureFrame should handle region cropping", () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      srcObject: {}
    } as HTMLVideoElement;
    
    const mockContext = {
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(1600).fill(100)
      }),
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: undefined
    };
    
    const mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
      width: 0,
      height: 0,
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,mock")
    } as unknown as HTMLCanvasElement;
    
    const region = { x: 10, y: 10, width: 50, height: 50 };
    const result = CaptureService.captureFrame(mockVideo, mockCanvas, region);
    
    expect(mockContext.drawImage).toHaveBeenCalled();
    expect(result.dataUrl).toContain("data:image/png;base64");
  });

  test("performOCR should dispatch to Aether when ollama engine selected", async () => {
    const mockSettings = {
      ocrEngine: 'ollama' as const,
      sourceLanguage: 'eng',
      ollamaVisionModel: 'llava',
      translationMode: false,
      targetLanguage: 'en',
      engine: 'google' as const,
      autoScan: false,
      scanRegion: 'full' as const,
      furigana: false,
      ollamaModel: '',
      openRouterKey: '',
      openRouterModel: '',
      ocrApiKey: ''
    };
    
    const result = await CaptureService.performOCR("data:image/png;base64,mock", mockSettings);
    expect(result.text).toBe("AI Result");
    expect(result.confidence).toBe(100);
  });
});
