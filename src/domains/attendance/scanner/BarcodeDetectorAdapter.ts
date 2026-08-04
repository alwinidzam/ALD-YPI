import { RawDetection } from './DetectionConfidence';
import { BoundingBox } from './DetectionOverlay';

export class BarcodeDetectorAdapter {
  private detector: any = null;
  private isSupported: boolean = false;

  async initialize(requestedFormats?: string[]): Promise<boolean> {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      this.isSupported = false;
      return false;
    }

    try {
      let supportedFormats = [
        'qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8',
        'upc_a', 'upc_e', 'data_matrix', 'pdf417', 'aztec', 'codabar'
      ];

      if (typeof (window as any).BarcodeDetector.getSupportedFormats === 'function') {
        const nativeSupported = await (window as any).BarcodeDetector.getSupportedFormats();
        supportedFormats = supportedFormats.filter(f => nativeSupported.includes(f));
      }

      if (requestedFormats && requestedFormats.length > 0) {
        supportedFormats = supportedFormats.filter(f => requestedFormats.includes(f));
      }

      if (supportedFormats.length > 0) {
        this.detector = new (window as any).BarcodeDetector({ formats: supportedFormats });
        this.isSupported = true;
        return true;
      }
    } catch {
      this.detector = null;
      this.isSupported = false;
    }
    return false;
  }

  getIsSupported(): boolean {
    return this.isSupported;
  }

  async detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData): Promise<RawDetection | null> {
    if (!this.detector || !this.isSupported) return null;

    try {
      const barcodes = await this.detector.detect(source);
      if (!barcodes || barcodes.length === 0) return null;

      const first = barcodes[0];
      const rawValue = first.rawValue;
      if (!rawValue) return null;

      let boundingBox: BoundingBox | undefined = undefined;

      let srcW = 100;
      let srcH = 100;

      if ('videoWidth' in source && source.videoWidth) {
        srcW = source.videoWidth;
        srcH = source.videoHeight;
      } else if ('width' in source) {
        srcW = source.width;
        srcH = source.height;
      }

      if (first.boundingBox) {
        const bbox = first.boundingBox;
        boundingBox = {
          x: (bbox.x / srcW) * 100,
          y: (bbox.y / srcH) * 100,
          width: (bbox.width / srcW) * 100,
          height: (bbox.height / srcH) * 100,
          cornerPoints: first.cornerPoints ? first.cornerPoints.map((pt: any) => ({
            x: (pt.x / srcW) * 100,
            y: (pt.y / srcH) * 100
          })) : undefined
        };
      }

      return {
        rawValue,
        format: first.format || 'unknown',
        boundingBox,
        engine: 'BarcodeDetector'
      };
    } catch {
      return null;
    }
  }
}
