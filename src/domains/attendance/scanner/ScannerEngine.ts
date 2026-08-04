import { CameraPipeline } from './CameraPipeline';
import { DecoderManager } from './DecoderManager';
import { FrameProcessor } from './FrameProcessor';
import { FocusManager } from './FocusManager';
import { ExposureManager } from './ExposureManager';
import { ZoomManager } from './ZoomManager';
import { TorchManager } from './TorchManager';
import { DetectionStabilizer, StabilizedDetection } from './DetectionStabilizer';
import { ScannerMetrics, ScannerMetricsData } from './ScannerMetrics';
import { ScannerSettings, ScannerSettingsConfig } from './ScannerSettings';
import { ScanPayload } from './types';
import { ScannerInputNormalizer } from './utils/ScannerInputNormalizer';

export type ScanCallback = (payload: ScanPayload) => void;
export type DetectionCallback = (stabilized: StabilizedDetection | null) => void;
export type ErrorCallback = (error: Error) => void;

export class ScannerEngine {
  private pipeline: CameraPipeline;
  private decoderManager: DecoderManager;
  private frameProcessor: FrameProcessor;
  private focusManager: FocusManager;
  private exposureManager: ExposureManager;
  private zoomManager: ZoomManager;
  private torchManager: TorchManager;
  private stabilizer: DetectionStabilizer;
  private metrics: ScannerMetrics;
  private settings: ScannerSettings;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastScanIntervalTime: number = 0;
  private videoElement: HTMLVideoElement | null = null;

  private scanCallbacks: Set<ScanCallback> = new Set();
  private detectionCallbacks: Set<DetectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  constructor(initialSettings?: Partial<ScannerSettingsConfig>) {
    this.settings = new ScannerSettings(initialSettings);
    this.metrics = new ScannerMetrics();
    this.pipeline = new CameraPipeline(this.settings);
    this.decoderManager = new DecoderManager(this.metrics);
    this.frameProcessor = new FrameProcessor(this.metrics);
    this.focusManager = new FocusManager(this.metrics);
    this.exposureManager = new ExposureManager();
    this.zoomManager = new ZoomManager(this.metrics);
    this.torchManager = new TorchManager(this.metrics);
    this.stabilizer = new DetectionStabilizer(1500); // 1.5s duplicate lockout

    this.pipeline.setOnDisconnect(() => {
      if (this.isRunning) {
        this.emitError(new Error('Kamera terputus atau izin dicabut.'));
      }
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.isPaused = true;
    } else {
      this.isPaused = false;
      if (this.isRunning && !this.pipeline.getStream()?.active) {
        this.restartStream().catch(err => this.emitError(err));
      }
    }
  };

  async initialize(): Promise<void> {
    await this.decoderManager.initialize(this.settings.getConfig().formats);
  }

  setVideoElement(videoEl: HTMLVideoElement | null): void {
    this.videoElement = videoEl;
    this.pipeline.setVideoElement(videoEl);
  }

  async start(deviceId?: string): Promise<void> {
    try {
      this.metrics.reset();
      const stream = await this.pipeline.startStream(deviceId, 'environment');

      await this.focusManager.setupAutoFocus(stream);
      await this.exposureManager.setupAutoExposure(stream);
      this.zoomManager.initTrackCapabilities(stream);

      this.isRunning = true;
      this.isPaused = false;
      this.startLoop();
    } catch (err: any) {
      this.isRunning = false;
      const error = new Error(`Gagal memulai kamera: ${err.message || 'Error tidak diketahui'}`);
      this.emitError(error);
      throw error;
    }
  }

  private async restartStream(): Promise<void> {
    const config = this.settings.getConfig();
    await this.start(config.preferredDeviceId || undefined);
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.pipeline.stopStream();
    this.torchManager.reset();
    this.zoomManager.reset();
    this.stabilizer.reset();
    this.metrics.reset();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  private startLoop = (): void => {
    if (!this.isRunning) return;

    this.metrics.recordFrame();
    const now = Date.now();
    const interval = this.settings.getConfig().scanIntervalMs;

    if (!this.isPaused && now - this.lastScanIntervalTime >= interval) {
      this.lastScanIntervalTime = now;
      this.processCurrentFrame();
    }

    this.animFrameId = requestAnimationFrame(this.startLoop);
  };

  private async processCurrentFrame(): Promise<void> {
    if (!this.videoElement || this.videoElement.readyState < 2) return;

    // 1. Frame environment analysis
    this.frameProcessor.processFrame(this.videoElement);

    // 2. Decode barcode / QR code frame
    const rawDetection = await this.decoderManager.decodeFrame(this.videoElement);

    // 3. Stabilization & Confidence evaluation
    const { shouldTrigger, stabilized } = this.stabilizer.process(rawDetection);

    // Emit live detection state for overlay drawing
    this.detectionCallbacks.forEach(cb => cb(stabilized));

    // 4. Trigger auto-zoom if small QR detected
    if (stabilized?.stabilizedBoundingBox) {
      this.zoomManager.handleAutoZoom(this.pipeline.getStream(), stabilized.stabilizedBoundingBox);
    }

    // 5. Emit confirmed scan event
    if (shouldTrigger && stabilized) {
      const normalizedToken = ScannerInputNormalizer.normalize(stabilized.rawValue);
      if (normalizedToken) {
        const payload: ScanPayload = {
          rawToken: stabilized.rawValue,
          normalizedToken,
          timestamp: new Date(),
          scannerType: 'CAMERA',
          deviceId: this.settings.getConfig().preferredDeviceId || 'CAMERA'
        };
        this.scanCallbacks.forEach(cb => cb(payload));
      }
    }
  }

  // Hardware Controls
  async toggleTorch(): Promise<boolean> {
    return this.torchManager.toggleTorch(this.pipeline.getStream());
  }

  async setZoom(zoomLevel: number): Promise<boolean> {
    return this.zoomManager.setZoom(this.pipeline.getStream(), zoomLevel);
  }

  async tapToFocus(normalizedX: number, normalizedY: number): Promise<boolean> {
    return this.focusManager.tapToFocus(this.pipeline.getStream(), normalizedX, normalizedY);
  }

  // Event Subscriptions
  onScan(cb: ScanCallback): () => void {
    this.scanCallbacks.add(cb);
    return () => this.scanCallbacks.delete(cb);
  }

  onDetection(cb: DetectionCallback): () => void {
    this.detectionCallbacks.add(cb);
    return () => this.detectionCallbacks.delete(cb);
  }

  onError(cb: ErrorCallback): () => void {
    this.errorCallbacks.add(cb);
    return () => this.errorCallbacks.delete(cb);
  }

  subscribeMetrics(cb: (metrics: ScannerMetricsData) => void): () => void {
    return this.metrics.subscribe(cb);
  }

  getMetrics(): ScannerMetricsData {
    return this.metrics.getData();
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getIsTorchSupported(): boolean {
    return this.torchManager.isSupported(this.pipeline.getStream());
  }

  getZoomState() {
    return this.zoomManager.getZoomState();
  }

  static async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    return CameraPipeline.getAvailableCameras();
  }

  private emitError(err: Error): void {
    this.errorCallbacks.forEach(cb => cb(err));
  }

  destroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.stop();
    this.scanCallbacks.clear();
    this.detectionCallbacks.clear();
    this.errorCallbacks.clear();
  }
}
