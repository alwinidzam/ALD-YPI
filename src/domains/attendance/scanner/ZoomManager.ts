import { ScannerMetrics } from './ScannerMetrics';
import { BoundingBox } from './DetectionOverlay';

export class ZoomManager {
  private metrics: ScannerMetrics;
  private currentZoom: number = 1.0;
  private minZoom: number = 1.0;
  private maxZoom: number = 5.0;
  private hasZoomCapability: boolean = false;

  constructor(metrics: ScannerMetrics) {
    this.metrics = metrics;
  }

  initTrackCapabilities(stream: MediaStream | null): void {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {} as any;
      if (caps.zoom) {
        this.minZoom = caps.zoom.min || 1.0;
        this.maxZoom = caps.zoom.max || 5.0;
        this.hasZoomCapability = true;
      } else {
        this.hasZoomCapability = false;
      }
    } catch {
      this.hasZoomCapability = false;
    }
  }

  async setZoom(stream: MediaStream | null, zoomLevel: number): Promise<boolean> {
    if (!stream || !this.hasZoomCapability) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;

    const clampedZoom = Math.min(Math.max(zoomLevel, this.minZoom), this.maxZoom);

    try {
      await track.applyConstraints({
        advanced: [{ zoom: clampedZoom }]
      } as any);
      this.currentZoom = clampedZoom;
      this.metrics.updateHardwareState({ zoomLevel: this.currentZoom });
      return true;
    } catch {
      return false;
    }
  }

  async handleAutoZoom(stream: MediaStream | null, bbox: BoundingBox | undefined): Promise<void> {
    if (!bbox || !this.hasZoomCapability || this.currentZoom > 1.5) return;

    // Calculate bounding box relative area (% of frame)
    const area = bbox.width * bbox.height; // e.g. 10% x 10% = 100

    // If QR code area is very small (< 150, i.e. < 1.5% of total screen)
    if (area > 0 && area < 150) {
      const targetZoom = Math.min(this.currentZoom * 1.5, Math.min(2.5, this.maxZoom));
      await this.setZoom(stream, targetZoom);
    }
  }

  getZoomState() {
    return {
      currentZoom: this.currentZoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      hasZoomCapability: this.hasZoomCapability
    };
  }

  reset(): void {
    this.currentZoom = 1.0;
    this.metrics.updateHardwareState({ zoomLevel: 1.0 });
  }
}
