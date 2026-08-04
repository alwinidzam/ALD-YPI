import { ScannerMetrics } from './ScannerMetrics';

export class FocusManager {
  private metrics: ScannerMetrics;

  constructor(metrics: ScannerMetrics) {
    this.metrics = metrics;
  }

  async setupAutoFocus(stream: MediaStream | null): Promise<void> {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {} as any;
      if (caps.focusMode && Array.isArray(caps.focusMode)) {
        let preferredMode = 'continuous';
        if (!caps.focusMode.includes('continuous') && caps.focusMode.includes('auto')) {
          preferredMode = 'auto';
        }

        await track.applyConstraints({
          advanced: [{ focusMode: preferredMode }]
        } as any);

        this.metrics.updateHardwareState({ focusMode: preferredMode });
      } else {
        this.metrics.updateHardwareState({ focusMode: 'auto' });
      }
    } catch {
      this.metrics.updateHardwareState({ focusMode: 'fixed' });
    }
  }

  async tapToFocus(stream: MediaStream | null, normalizedX: number, normalizedY: number): Promise<boolean> {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;

    try {
      const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {} as any;
      
      // If pointOfInterest is supported
      if (caps.pointsOfInterest) {
        await track.applyConstraints({
          advanced: [{
            pointsOfInterest: [{ x: normalizedX, y: normalizedY }]
          }]
        } as any);
        return true;
      } else if (caps.focusMode && caps.focusMode.includes('auto')) {
        // Trigger manual refocus pulse
        await track.applyConstraints({ advanced: [{ focusMode: 'auto' }] } as any);
        setTimeout(async () => {
          try {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
          } catch {
            // Ignore constraint errors
          }
        }, 800);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
}
