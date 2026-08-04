import { BrowserMultiFormatReader } from '@zxing/browser';
import { RawDetection } from './DetectionConfidence';
import { BoundingBox } from './DetectionOverlay';

export class ZXingAdapter {
  private reader: BrowserMultiFormatReader | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private isInitialized: boolean = false;

  initialize(): boolean {
    try {
      this.reader = new BrowserMultiFormatReader();
      if (typeof document !== 'undefined') {
        this.offscreenCanvas = document.createElement('canvas');
      }
      this.isInitialized = true;
      return true;
    } catch {
      this.isInitialized = false;
      return false;
    }
  }

  detectFromVideo(videoEl: HTMLVideoElement): RawDetection | null {
    if (!this.reader || !videoEl || videoEl.readyState < 2) return null;

    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || 480;

    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
    }
    if (this.offscreenCanvas.width !== vw || this.offscreenCanvas.height !== vh) {
      this.offscreenCanvas.width = vw;
      this.offscreenCanvas.height = vh;
    }

    const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // 1. Pass: Normal orientation (0°)
    ctx.drawImage(videoEl, 0, 0, vw, vh);
    let result = this.decodeCanvas(this.offscreenCanvas);
    if (result) {
      return this.formatResult(result, vw, vh, 0, false);
    }

    // 2. Pass: Horizontal Mirror (Selfie/Inverted QR)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, -vw, 0, vw, vh);
    ctx.restore();
    result = this.decodeCanvas(this.offscreenCanvas);
    if (result) {
      return this.formatResult(result, vw, vh, 0, true);
    }

    // 3. Pass: 90° Rotation (Vertical phone alignment)
    ctx.save();
    ctx.translate(vw / 2, vh / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(videoEl, -vw / 2, -vh / 2, vw, vh);
    ctx.restore();
    result = this.decodeCanvas(this.offscreenCanvas);
    if (result) {
      return this.formatResult(result, vw, vh, 90, false);
    }

    // 4. Pass: 180° Inverted Rotation
    ctx.save();
    ctx.translate(vw / 2, vh / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(videoEl, -vw / 2, -vh / 2, vw, vh);
    ctx.restore();
    result = this.decodeCanvas(this.offscreenCanvas);
    if (result) {
      return this.formatResult(result, vw, vh, 180, false);
    }

    // 5. Pass: Invert Colors (For negative QR codes on dark backgrounds)
    ctx.drawImage(videoEl, 0, 0, vw, vh);
    const imgData = ctx.getImageData(0, 0, vw, vh);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];       // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
    }
    ctx.putImageData(imgData, 0, 0);
    result = this.decodeCanvas(this.offscreenCanvas);
    if (result) {
      return this.formatResult(result, vw, vh, 0, false);
    }

    return null;
  }

  private decodeCanvas(canvas: HTMLCanvasElement): any | null {
    if (!this.reader) return null;
    try {
      const res = this.reader.decodeFromCanvas(canvas);
      if (res && res.getText()) {
        return res;
      }
    } catch {
      // Ignore ZXing decode error when frame contains no code
    }
    return null;
  }

  private formatResult(result: any, vw: number, vh: number, rotation: number, isMirrored: boolean): RawDetection {
    const rawValue = result.getText();
    const formatName = result.getBarcodeFormat() ? result.getBarcodeFormat().toString() : 'QR_CODE';

    let boundingBox: BoundingBox | undefined = undefined;
    const points = result.getResultPoints();

    if (points && points.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      points.forEach(pt => {
        let x = pt.getX();
        let y = pt.getY();

        // Reverse mirroring transform if needed
        if (isMirrored) {
          x = vw - x;
        }

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });

      if (minX !== Infinity && maxX !== -Infinity) {
        const w = Math.max(maxX - minX, 20);
        const h = Math.max(maxY - minY, 20);
        boundingBox = {
          x: Math.max(0, (minX / vw) * 100),
          y: Math.max(0, (minY / vh) * 100),
          width: Math.min(100, (w / vw) * 100),
          height: Math.min(100, (h / vh) * 100)
        };
      }
    }

    // Default centered fallback box if points were absent
    if (!boundingBox) {
      boundingBox = {
        x: 30,
        y: 30,
        width: 40,
        height: 40
      };
    }

    return {
      rawValue,
      format: formatName,
      boundingBox,
      engine: 'ZXing'
    };
  }
}
