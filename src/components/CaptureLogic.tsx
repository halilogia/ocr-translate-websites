"use client";

import { AppSettings } from "@/types";
import { TesseractEngine, TesseractResult } from "../engines/TesseractEngine";
import { OllamaEngine, OllamaResult } from "../engines/OllamaEngine";

export interface CaptureResult {
  dataUrl: string;
  isBlack: boolean;
}

export interface TextRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export class CaptureService {
  private static lastFrameHash: string = '';

  static computeFrameHash(context: CanvasRenderingContext2D, width: number, height: number): string {
    const step = Math.max(1, Math.floor(width / 32));
    const imageData = context.getImageData(0, 0, width, height);
    let hash = '';
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = Math.floor(imageData.data[i] / 32) * 32;
        const g = Math.floor(imageData.data[i + 1] / 32) * 32;
        const b = Math.floor(imageData.data[i + 2] / 32) * 32;
        hash += `${r},${g},${b};`;
      }
    }
    return hash;
  }

  static hasFrameChanged(context: CanvasRenderingContext2D, width: number, height: number): boolean {
    const currentHash = this.computeFrameHash(context, width, height);
    if (this.lastFrameHash === '') {
      this.lastFrameHash = currentHash;
      return true;
    }
    if (currentHash === this.lastFrameHash) {
      return false;
    }
    this.lastFrameHash = currentHash;
    return true;
  }

  static resetFrameHash(): void {
    this.lastFrameHash = '';
  }

  /**
   * Detect text regions in a frame using pixel density analysis
   * Returns bounding boxes of areas likely to contain text
   */
  static detectTextRegions(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): TextRegion[] {
    const regions: TextRegion[] = [];
    
    // Get full frame data
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Grid-based analysis: divide screen into cells and find text-dense areas
    const cellSize = Math.max(20, Math.floor(Math.min(width, height) / 40));
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    
    // Calculate text density for each cell
    const densityMap: number[][] = [];
    
    for (let row = 0; row < rows; row++) {
      densityMap[row] = [];
      for (let col = 0; col < cols; col++) {
        let textPixels = 0;
        let totalPixels = 0;
        
        const startX = col * cellSize;
        const startY = row * cellSize;
        const endX = Math.min(startX + cellSize, width);
        const endY = Math.min(startY + cellSize, height);
        
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check for high contrast (text-like) pixels
            // Text is usually very different from background
            const brightness = (r + g + b) / 3;
            const isEdge = this.isEdgePixel(data, x, y, width, height);
            
            if (isEdge && brightness > 20 && brightness < 235) {
              textPixels++;
            }
            totalPixels++;
          }
        }
        
        densityMap[row][col] = totalPixels > 0 ? textPixels / totalPixels : 0;
      }
    }
    
    // Find clusters of high-density cells
    const minDensity = 0.15; // Minimum text density to consider
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!visited[row][col] && densityMap[row][col] >= minDensity) {
          // Found a text region - flood fill to find boundaries
          const region = this.floodFillRegion(densityMap, visited, row, col, rows, cols, minDensity, cellSize);
          if (region && region.width > cellSize && region.height > cellSize * 0.5) {
            regions.push(region);
          }
        }
      }
    }
    
    // Merge overlapping regions
    return this.mergeOverlappingRegions(regions);
  }
  
  private static isEdgePixel(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const i = (y * width + x) * 4;
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Check neighbors for contrast
    const neighbors = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];
    
    let maxContrast = 0;
    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const ni = (ny * width + nx) * 4;
        const neighborBrightness = (data[ni] + data[ni + 1] + data[ni + 2]) / 3;
        const contrast = Math.abs(brightness - neighborBrightness);
        maxContrast = Math.max(maxContrast, contrast);
      }
    }
    
    return maxContrast > 50; // High contrast = likely text edge
  }
  
  private static floodFillRegion(
    densityMap: number[][],
    visited: boolean[][],
    startRow: number,
    startCol: number,
    rows: number,
    cols: number,
    minDensity: number,
    cellSize: number
  ): TextRegion | null {
    const queue: [number, number][] = [[startRow, startCol]];
    visited[startRow][startCol] = true;
    
    let minRow = startRow, maxRow = startRow;
    let minCol = startCol, maxCol = startCol;
    let totalDensity = 0;
    let cellCount = 0;
    
    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      totalDensity += densityMap[row][col];
      cellCount++;
      
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
      
      // Check 8 neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && densityMap[nr][nc] >= minDensity) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
    }
    
    if (cellCount < 2) return null;
    
    return {
      x: minCol * cellSize,
      y: minRow * cellSize,
      width: (maxCol - minCol + 1) * cellSize,
      height: (maxRow - minRow + 1) * cellSize,
      confidence: totalDensity / cellCount
    };
  }
  
  private static mergeOverlappingRegions(regions: TextRegion[]): TextRegion[] {
    if (regions.length === 0) return [];
    
    const merged: TextRegion[] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      let current = { ...regions[i] };
      used.add(i);
      
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;
        
        if (this.regionsOverlap(current, regions[j])) {
          // Merge regions
          current = {
            x: Math.min(current.x, regions[j].x),
            y: Math.min(current.y, regions[j].y),
            width: Math.max(current.x + current.width, regions[j].x + regions[j].width) - Math.min(current.x, regions[j].x),
            height: Math.max(current.y + current.height, regions[j].y + regions[j].height) - Math.min(current.y, regions[j].y),
            confidence: (current.confidence + regions[j].confidence) / 2
          };
          used.add(j);
        }
      }
      
      merged.push(current);
    }
    
    return merged;
  }
  
  private static regionsOverlap(a: TextRegion, b: TextRegion): boolean {
    const padding = 10;
    return !(
      a.x + a.width + padding < b.x ||
      b.x + b.width + padding < a.x ||
      a.y + a.height + padding < b.y ||
      b.y + b.height + padding < a.y
    );
  }

  static async performOCR(imageSrc: string, settings: AppSettings): Promise<OCRResult> {
    if (!imageSrc || imageSrc === "data:,") {
      return { text: "", confidence: 0 };
    }
    
    if (settings.ocrEngine === 'ollama') {
      const result: OllamaResult = await OllamaEngine.performOCR(imageSrc, settings.ollamaVisionModel);
      return { text: result.text, confidence: result.confidence };
    } else {
      const result: TesseractResult = await TesseractEngine.performOCR(imageSrc, settings.sourceLanguage);
      return { text: result.text, confidence: result.confidence };
    }
  }

  static captureFrame(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    region?: { x: number, y: number, width: number, height: number },
    isAether: boolean = false
  ): CaptureResult {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return { dataUrl: "", isBlack: true };

    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    
    if (region) {
      sx = (region.x / 100) * video.videoWidth;
      sy = (region.y / 100) * video.videoHeight;
      sw = (region.width / 100) * video.videoWidth;
      sh = (region.height / 100) * video.videoHeight;
      
      sx = Math.max(0, sx); sy = Math.max(0, sy);
      sw = Math.min(sw, video.videoWidth - sx);
      sh = Math.min(sh, video.videoHeight - sy);
    }

    // For OCR (Aether), use higher resolution for better text recognition
    const aiScale = isAether ? Math.min(2.0, 2048 / Math.max(sw, sh)) : 1.0;
    canvas.width = Math.max(64, Math.round(sw * aiScale)); 
    canvas.height = Math.max(64, Math.round(sh * aiScale));
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    
    // For OCR: enhance contrast and sharpness for better text recognition
    if (isAether) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply contrast enhancement and slight sharpening
      const contrast = 1.3; // Increase contrast by 30%
      const intercept = 128 * (1 - contrast);
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast
        data[i] = Math.min(255, Math.max(0, data[i] * contrast + intercept));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrast + intercept)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrast + intercept)); // B
      }
      
      context.putImageData(imageData, 0, 0);
    }
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    // Black Frame Detection - Sample from center to avoid edge UI elements
    const sampleSize = 40;
    const startX = Math.max(0, Math.floor((canvas.width - sampleSize) / 2));
    const startY = Math.max(0, Math.floor((canvas.height - sampleSize) / 2));
    
    let imageData;
    try {
      imageData = context.getImageData(startX, startY, sampleSize, sampleSize);
    } catch {
      return { dataUrl, isBlack: false };
    }
    
    const checkData = imageData.data;
    let totalBrightness = 0;
    const pixelCount = sampleSize * sampleSize;
    
    for(let i=0; i<checkData.length; i+=4) {
        const brightness = (checkData[i] + checkData[i+1] + checkData[i+2]) / 3;
        totalBrightness += brightness;
    }
    
    const averageBrightness = totalBrightness / pixelCount;
    const isBlack = averageBrightness < 10;
    
    if(isBlack && typeof document !== 'undefined') {
        const thumbContainer = document.getElementById('vision-thumbnail-container');
        if(thumbContainer) thumbContainer.innerHTML = `<div style="color:#ef4444;font-size:10px;text-align:center;margin-top:20px;font-weight:bold">BLACK FRAME</div>`;
    } else if(typeof document !== 'undefined') {
        const thumbContainer = document.getElementById('vision-thumbnail-container');
        if(thumbContainer && thumbContainer.querySelector('img')) {
          (thumbContainer.querySelector('img') as HTMLImageElement).src = dataUrl;
        } else if(thumbContainer) {
          thumbContainer.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
        }
    }

    return { dataUrl, isBlack };
  }
}
