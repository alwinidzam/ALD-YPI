import { ScannerSessionState, ScannerType, ScannerConnectionStatus } from '../types';

export class ScannerSessionManager {
  private state: ScannerSessionState;
  private listeners: Set<(state: ScannerSessionState) => void> = new Set();
  private onlineListener?: () => void;
  private offlineListener?: () => void;

  constructor(activeType: ScannerType = 'USB') {
    this.state = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
      activeScannerType: activeType,
      connectionStatus: 'DISCONNECTED',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      totalScanCount: 0,
      successfulScanCount: 0,
      failedScanCount: 0,
    };

    this.registerNetworkListeners();
  }

  private registerNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    this.onlineListener = () => {
      this.updateState({ isOnline: true });
    };
    this.offlineListener = () => {
      this.updateState({ isOnline: false });
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      if (this.onlineListener) window.removeEventListener('online', this.onlineListener);
      if (this.offlineListener) window.removeEventListener('offline', this.offlineListener);
    }
    this.listeners.clear();
  }

  getState(): ScannerSessionState {
    return { ...this.state };
  }

  subscribe(callback: (state: ScannerSessionState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  setActiveScannerType(type: ScannerType): void {
    this.updateState({ activeScannerType: type });
  }

  setConnectionStatus(status: ScannerConnectionStatus, errorMessage?: string): void {
    this.updateState({
      connectionStatus: status,
      lastErrorMessage: errorMessage ?? (status === 'ERROR' ? this.state.lastErrorMessage : undefined)
    });
  }

  recordScanAttempt(): void {
    this.updateState({
      totalScanCount: this.state.totalScanCount + 1,
      lastScanTimestamp: new Date()
    });
  }

  recordScanSuccess(): void {
    this.updateState({
      successfulScanCount: this.state.successfulScanCount + 1
    });
  }

  recordScanFailure(errorMessage: string): void {
    this.updateState({
      failedScanCount: this.state.failedScanCount + 1,
      lastErrorMessage: errorMessage
    });
  }

  resetSession(): void {
    this.state = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
      activeScannerType: this.state.activeScannerType,
      connectionStatus: this.state.connectionStatus,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      totalScanCount: 0,
      successfulScanCount: 0,
      failedScanCount: 0,
    };
    this.notify();
  }

  private updateState(partial: Partial<ScannerSessionState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(cb => cb(this.getState()));
  }
}
