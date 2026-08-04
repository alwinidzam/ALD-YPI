import { IScannerAdapter, ScanPayload, ScannerConnectionStatus, ScannerType } from '../types';
import { ScannerEngine, DetectionCallback } from '../ScannerEngine';
import { ScannerMetricsData } from '../ScannerMetrics';
import { StabilizedDetection } from '../DetectionStabilizer';

export interface CameraScannerOptions {
  videoElement?: HTMLVideoElement;
  facingMode?: 'user' | 'environment';
  scanIntervalMs?: number;
}

export class CameraScannerAdapter implements IScannerAdapter {
  readonly scannerType: ScannerType = 'CAMERA';

  private status: ScannerConnectionStatus = 'DISCONNECTED';
  private engine: ScannerEngine;
  private videoElement: HTMLVideoElement | null = null;

  private scanCallbacks: Set<(payload: ScanPayload) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private statusCallbacks: Set<(status: ScannerConnectionStatus) => void> = new Set();
  private detectionCallbacks: Set<DetectionCallback> = new Set();

  constructor(options?: CameraScannerOptions) {
    this.videoElement = options?.videoElement ?? null;
    this.engine = new ScannerEngine({
      scanIntervalMs: options?.scanIntervalMs ?? 80
    });

    if (this.videoElement) {
      this.engine.setVideoElement(this.videoElement);
    }

    // Subscribe engine events
    this.engine.onScan(payload => {
      this.scanCallbacks.forEach(cb => cb(payload));
    });

    this.engine.onError(err => {
      this.setStatus('ERROR');
      this.errorCallbacks.forEach(cb => cb(err));
    });

    this.engine.onDetection(stabilized => {
      this.detectionCallbacks.forEach(cb => cb(stabilized));
    });
  }

  setVideoElement(element: HTMLVideoElement | null): void {
    this.videoElement = element;
    this.engine.setVideoElement(element);
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      this.setStatus('ERROR');
      const err = new Error('API Kamera (MediaDevices) tidak didukung pada lingkungan browser ini. Pastikan menggunakan HTTPS.');
      this.errorCallbacks.forEach(cb => cb(err));
      return;
    }

    this.setStatus('INITIALIZING');
    try {
      await this.engine.initialize();
    } catch {
      // Continue gracefully even if native detector initialization fails
    }
  }

  async startCamera(deviceId?: string): Promise<void> {
    try {
      this.setStatus('INITIALIZING');
      await this.engine.start(deviceId);
      this.setStatus('CONNECTED');
    } catch (err: any) {
      this.setStatus('ERROR');
      let msg = err?.message || 'Gagal mengakses kamera.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak oleh pengguna atau browser.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = 'Perangkat kamera tidak ditemukan.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg = 'Kamera sedang digunakan oleh aplikasi lain.';
      }
      const error = new Error(`Failed to access camera: ${msg}`);
      this.errorCallbacks.forEach(cb => cb(error));
      throw error;
    }
  }

  async toggleTorch(): Promise<boolean> {
    return this.engine.toggleTorch();
  }

  isTorchSupported(): boolean {
    return this.engine.getIsTorchSupported();
  }

  async setZoom(zoomLevel: number): Promise<boolean> {
    return this.engine.setZoom(zoomLevel);
  }

  async tapToFocus(x: number, y: number): Promise<boolean> {
    return this.engine.tapToFocus(x, y);
  }

  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  stopCamera(): void {
    this.engine.stop();
    this.setStatus('DISCONNECTED');
  }

  destroy(): void {
    this.stopCamera();
    this.engine.destroy();
    this.scanCallbacks.clear();
    this.errorCallbacks.clear();
    this.statusCallbacks.clear();
    this.detectionCallbacks.clear();
  }

  getStatus(): ScannerConnectionStatus {
    return this.status;
  }

  getEngine(): ScannerEngine {
    return this.engine;
  }

  onScan(callback: (payload: ScanPayload) => void): () => void {
    this.scanCallbacks.add(callback);
    return () => this.scanCallbacks.delete(callback);
  }

  onDetection(callback: DetectionCallback): () => void {
    this.detectionCallbacks.add(callback);
    return () => this.detectionCallbacks.delete(callback);
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onStatusChange(callback: (status: ScannerConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  subscribeMetrics(callback: (metrics: ScannerMetricsData) => void): () => void {
    return this.engine.subscribeMetrics(callback);
  }

  private setStatus(newStatus: ScannerConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusCallbacks.forEach(cb => cb(newStatus));
    }
  }

  getMetrics(): ScannerMetricsData {
    return this.engine.getMetrics();
  }

  static async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    return ScannerEngine.getAvailableCameras();
  }
}
