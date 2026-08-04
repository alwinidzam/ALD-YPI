export type ScannerType = 'USB' | 'CAMERA' | 'MANUAL';

export type ScannerConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'INITIALIZING' | 'ERROR';

export interface ScanPayload {
  rawToken: string;
  normalizedToken: string;
  timestamp: Date;
  scannerType: ScannerType;
  deviceId?: string;
  latencyMs?: number;
}

export interface ScannerConfig {
  minTokenLength: number;
  maxTokenLength: number;
  debounceMs: number;
  suffixKey: string; // Default: 'Enter'
  interKeyTimeoutMs: number; // Max time between keystrokes for USB scanner (e.g. 50ms)
  soundFeedbackEnabled: boolean;
  autoProcessScan: boolean;
}

export interface IScannerAdapter {
  readonly scannerType: ScannerType;
  initialize(): Promise<void>;
  destroy(): void;
  getStatus(): ScannerConnectionStatus;
  onScan(callback: (payload: ScanPayload) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  onStatusChange(callback: (status: ScannerConnectionStatus) => void): () => void;
}

export interface ScannerSessionState {
  sessionId: string;
  startTime: Date;
  activeScannerType: ScannerType;
  connectionStatus: ScannerConnectionStatus;
  isOnline: boolean;
  totalScanCount: number;
  successfulScanCount: number;
  failedScanCount: number;
  lastScanTimestamp?: Date;
  lastErrorMessage?: string;
}
