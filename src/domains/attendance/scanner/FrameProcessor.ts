import { ScannerMetrics } from './ScannerMetrics';

export class FrameProcessor {
  private analysisCanvas: HTMLCanvasElement | null = null;
  private metrics: ScannerMetrics;

  constructor(metrics: ScannerMetrics) {
    this.metrics = metrics;
    if (typeof document !== 'undefined') {
      this.analysisCanvas = document.createElement('canvas');
      this.analysisCanvas.width = 64;  // Small low-cost sampling grid
      this.analysisCanvas.height = 64;
    }
  }

  processFrame(videoEl: HTMLVideoElement): void {
    if (!videoEl || videoEl.readyState < 2) return;

    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || 480;

    // 1. Update resolution metric
    this.metrics.updateHardwareState({
      resolution: { width: vw, height: vh }
    });

    // 2. Perform light level / luminance analysis
    if (this.analysisCanvas) {
      const ctx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, 64, 64);
        const imgData = ctx.getImageData(0, 0, 64, 64);
        const data = imgData.data;

        let totalLuminance = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Rec. 709 luma formula
          totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        const avgLuminance = totalLuminance / pixelCount;
        const lowLight = avgLuminance < 40; // Luminance < 40 out of 255

        this.metrics.updateHardwareState({
          lowLightWarning: lowLight
        });
      }
    }
  }
}
