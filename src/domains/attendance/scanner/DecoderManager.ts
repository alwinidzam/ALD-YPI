import { BarcodeDetectorAdapter } from './BarcodeDetectorAdapter';
import { ZXingAdapter } from './ZXingAdapter';
import { RawDetection } from './DetectionConfidence';
import { ScannerMetrics } from './ScannerMetrics';

export class DecoderManager {
  private barcodeDetectorAdapter: BarcodeDetectorAdapter;
  private zxingAdapter: ZXingAdapter;
  private metrics: ScannerMetrics;

  constructor(metrics: ScannerMetrics) {
    this.metrics = metrics;
    this.barcodeDetectorAdapter = new BarcodeDetectorAdapter();
    this.zxingAdapter = new ZXingAdapter();
  }

  async initialize(requestedFormats?: string[]): Promise<void> {
    await this.barcodeDetectorAdapter.initialize(requestedFormats);
    this.zxingAdapter.initialize();
  }

  async decodeFrame(videoEl: HTMLVideoElement): Promise<RawDetection | null> {
    if (!videoEl || videoEl.readyState < 2) return null;

    const startTime = performance.now();
    let result: RawDetection | null = null;

    // 1. Primary Engine: Native Hardware BarcodeDetector
    if (this.barcodeDetectorAdapter.getIsSupported()) {
      result = await this.barcodeDetectorAdapter.detect(videoEl);
    }

    // 2. Secondary Engine: ZXing Multi-Angle / Inverted Fallback
    if (!result) {
      result = this.zxingAdapter.detectFromVideo(videoEl);
    }

    const latency = performance.now() - startTime;

    if (result) {
      this.metrics.recordDecode(latency, result.engine, result.format, 90);
    } else {
      if (latency > 150) {
        this.metrics.recordDroppedFrame();
      }
    }

    return result;
  }
}
