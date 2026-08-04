import { ScannerMetrics } from './ScannerMetrics';

export class TorchManager {
  private metrics: ScannerMetrics;
  private isTorchOn: boolean = false;

  constructor(metrics: ScannerMetrics) {
    this.metrics = metrics;
  }

  isSupported(stream: MediaStream | null): boolean {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    try {
      const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {} as any;
      return !!capabilities.torch;
    } catch {
      return false;
    }
  }

  async toggleTorch(stream: MediaStream | null): Promise<boolean> {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;

    try {
      if (this.isSupported(stream)) {
        this.isTorchOn = !this.isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: this.isTorchOn }]
        } as any);
        this.metrics.updateHardwareState({ torchState: this.isTorchOn });
        return this.isTorchOn;
      }
    } catch {
      this.isTorchOn = false;
      this.metrics.updateHardwareState({ torchState: false });
    }
    return false;
  }

  getTorchState(): boolean {
    return this.isTorchOn;
  }

  reset(): void {
    this.isTorchOn = false;
    this.metrics.updateHardwareState({ torchState: false });
  }
}
