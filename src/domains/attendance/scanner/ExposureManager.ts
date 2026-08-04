export class ExposureManager {
  async setupAutoExposure(stream: MediaStream | null): Promise<void> {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {} as any;
      if (caps.exposureMode && Array.isArray(caps.exposureMode)) {
        let preferredMode = 'continuous';
        if (!caps.exposureMode.includes('continuous') && caps.exposureMode.includes('auto')) {
          preferredMode = 'auto';
        }

        await track.applyConstraints({
          advanced: [{ exposureMode: preferredMode }]
        } as any);
      }
    } catch {
      // Ignore exposure constraint errors
    }
  }

  async setExposureCompensation(stream: MediaStream | null, value: number): Promise<boolean> {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;

    try {
      const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {} as any;
      if (caps.exposureCompensation) {
        const clamped = Math.min(Math.max(value, caps.exposureCompensation.min), caps.exposureCompensation.max);
        await track.applyConstraints({
          advanced: [{ exposureCompensation: clamped }]
        } as any);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
}
