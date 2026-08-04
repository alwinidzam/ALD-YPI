export interface ScannerSettingsConfig {
  formats: string[];
  targetFps: number;
  fullFrameScan: boolean;
  mirrorFrontCamera: boolean;
  autoZoom: boolean;
  confidenceThreshold: number;
  debugMode: boolean;
  preferredDeviceId: string | null;
  scanIntervalMs: number;
}

export const DEFAULT_SCANNER_SETTINGS: ScannerSettingsConfig = {
  formats: [
    'qr_code',
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e',
    'data_matrix',
    'pdf417',
    'aztec',
    'codabar'
  ],
  targetFps: 30,
  fullFrameScan: true,
  mirrorFrontCamera: true,
  autoZoom: true,
  confidenceThreshold: 70, // Confidence score percentage required
  debugMode: false,
  preferredDeviceId: null,
  scanIntervalMs: 80 // <100ms decode cycle target
};

export class ScannerSettings {
  private config: ScannerSettingsConfig;

  constructor(initialConfig?: Partial<ScannerSettingsConfig>) {
    this.config = {
      ...DEFAULT_SCANNER_SETTINGS,
      ...initialConfig,
      preferredDeviceId: this.loadPreferredDeviceId()
    };
  }

  getConfig(): ScannerSettingsConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ScannerSettingsConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.preferredDeviceId !== undefined) {
      this.savePreferredDeviceId(updates.preferredDeviceId);
    }
  }

  private loadPreferredDeviceId(): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem('scanner_v2_preferred_camera');
      } catch {
        return null;
      }
    }
    return null;
  }

  private savePreferredDeviceId(deviceId: string | null): void {
    if (typeof localStorage !== 'undefined') {
      try {
        if (deviceId) {
          localStorage.setItem('scanner_v2_preferred_camera', deviceId);
        } else {
          localStorage.removeItem('scanner_v2_preferred_camera');
        }
      } catch {
        // Ignore storage errors
      }
    }
  }
}
