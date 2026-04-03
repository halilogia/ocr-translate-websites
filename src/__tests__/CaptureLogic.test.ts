import { CaptureService } from "@/components/CaptureLogic";

// Mocking Tesseract.js since we don't want to run real OCR in unit tests
jest.mock("tesseract.js", () => ({
  createWorker: jest.fn().mockImplementation(() => ({
    recognize: jest.fn().mockResolvedValue({
      data: { text: "Hello World", confidence: 90 }
    }),
    terminate: jest.fn().mockResolvedValue(null)
  }))
}));

describe("CaptureService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("performOCR should return text and confidence", async () => {
    const result = await CaptureService.performOCR("data:image/png;base64,mock");
    expect(result.text).toBe("Hello World");
    expect(result.confidence).toBe(90);
  });

  test("captureFrame should return null for invalid video", () => {
    const mockVideo = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
    const mockCanvas = {} as HTMLCanvasElement;
    const result = CaptureService.captureFrame(mockVideo, mockCanvas);
    expect(result).toBeNull();
  });

  test("performOCR should return empty for invalid image source", async () => {
    const result = await CaptureService.performOCR("");
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
  });
});
