export interface ScannerMetricsData {
  fps: number;
  decodeLatencyMs: number;
  confidence: number;
  detectedFormat: string | null;
  engine: 'BarcodeDetector' | 'ZXing' | 'None';
  resolution: { width: number; height: number };
  focusMode: string;
  torchState: boolean;
  zoomLevel: number;
  droppedFrames: number;
  lowLightWarning: boolean;
  totalDecodes: number;
}

export type MetricsListener = (metrics: ScannerMetricsData) => void;

export class ScannerMetrics {
  private data: ScannerMetricsData = {
    fps: 0,
    decodeLatencyMs: 0,
    confidence: 0,
    detectedFormat: null,
    engine: 'None',
    resolution: { width: 0, height: 0 },
    focusMode: 'continuous',
    torchState: false,
    zoomLevel: 1.0,
    droppedFrames: 0,
    lowLightWarning: false,
    totalDecodes: 0
  };

  private frameTimes: number[] = [];
  private listeners: Set<MetricsListener> = new Set();

  recordFrame(): void {
    const now = performance.now();
    this.frameTimes.push(now);
    // Keep frame times for the last 1 second
    this.frameTimes = this.frameTimes.filter(t => now - t <= 1000);
    this.data.fps = this.frameTimes.length;
    this.notify();
  }

  recordDecode(latencyMs: number, engine: 'BarcodeDetector' | 'ZXing', format: string | null, confidence: number): void {
    this.data.totalDecodes++;
    // Exponential rolling average for decode latency
    this.data.decodeLatencyMs = Math.round(
      this.data.decodeLatencyMs === 0
        ? latencyMs
        : this.data.decodeLatencyMs * 0.7 + latencyMs * 0.3
    );
    this.data.engine = engine;
    this.data.detectedFormat = format;
    this.data.confidence = confidence;
    this.notify();
  }

  recordDroppedFrame(): void {
    this.data.droppedFrames++;
    this.notify();
  }

  updateHardwareState(state: Partial<Pick<ScannerMetricsData, 'resolution' | 'focusMode' | 'torchState' | 'zoomLevel' | 'lowLightWarning'>>): void {
    this.data = { ...this.data, ...state };
    this.notify();
  }

  getData(): ScannerMetricsData {
    return { ...this.data };
  }

  subscribe(listener: MetricsListener): () => void {
    this.listeners.add(listener);
    listener(this.getData());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const current = this.getData();
    this.listeners.forEach(cb => cb(current));
  }

  reset(): void {
    this.frameTimes = [];
    this.data = {
      fps: 0,
      decodeLatencyMs: 0,
      confidence: 0,
      detectedFormat: null,
      engine: 'None',
      resolution: { width: 0, height: 0 },
      focusMode: 'continuous',
      torchState: false,
      zoomLevel: 1.0,
      droppedFrames: 0,
      lowLightWarning: false,
      totalDecodes: 0
    };
    this.notify();
  }
}
