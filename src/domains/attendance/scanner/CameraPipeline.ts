import { ScannerSettings } from './ScannerSettings';

export class CameraPipeline {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private settings: ScannerSettings;
  private onDisconnectCallback: (() => void) | null = null;

  constructor(settings: ScannerSettings) {
    this.settings = settings;
  }

  setVideoElement(videoEl: HTMLVideoElement | null): void {
    this.videoElement = videoEl;
    if (this.videoElement && this.stream) {
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      this.videoElement.srcObject = this.stream;
      this.videoElement.play().catch(e => console.warn('Deferred video play:', e));
    }
  }

  async startStream(deviceId?: string, facingMode: 'user' | 'environment' = 'environment'): Promise<MediaStream> {
    if (this.stream) {
      this.stopStream();
    }

    const preferredId = deviceId || this.settings.getConfig().preferredDeviceId;

    const constraintOptions: MediaStreamConstraints[] = preferredId
      ? [
          { video: { deviceId: { exact: preferredId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } } },
          { video: { deviceId: preferredId } }
        ]
      : [
          { video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } } },
          { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          { video: { facingMode: { ideal: facingMode } } },
          { video: true }
        ];

    let activeStream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of constraintOptions) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!activeStream) {
      throw lastError || new Error('Gagal menginisialisasi kamera.');
    }

    this.stream = activeStream;

    // Store active device ID if available
    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = typeof videoTrack.getSettings === 'function' ? videoTrack.getSettings() : {};
      if (settings.deviceId) {
        this.settings.updateConfig({ preferredDeviceId: settings.deviceId });
      }

      // Track disconnection or permission drop
      videoTrack.onended = () => {
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      };
    }

    if (this.videoElement) {
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play().catch(e => console.warn('Video play error:', e));
    }

    return this.stream;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.onended = null;
        track.stop();
      });
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  setOnDisconnect(cb: () => void): void {
    this.onDisconnectCallback = cb;
  }

  static async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch {
      return [];
    }
  }
}
