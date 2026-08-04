import { IScannerAdapter, ScanPayload, ScannerConfig, ScannerType, ScannerSessionState } from '../types';
import { USBScannerAdapter } from '../adapters/USBScannerAdapter';
import { CameraScannerAdapter } from '../adapters/CameraScannerAdapter';
import { ScannerInputNormalizer } from '../utils/ScannerInputNormalizer';
import { HardwareDebouncer } from '../utils/HardwareDebouncer';
import { ScannerFeedbackEngine } from './ScannerFeedbackEngine';
import { ScannerSessionManager } from './ScannerSessionManager';
import { AttendanceService } from '../../services/AttendanceService';
import { Attendance, AttendanceSource } from '../../types';

export class UnifiedScannerService {
  private usbAdapter: USBScannerAdapter;
  private cameraAdapter: CameraScannerAdapter;
  private debouncer: HardwareDebouncer;
  private feedbackEngine: ScannerFeedbackEngine;
  private sessionManager: ScannerSessionManager;

  private activeAdapter: IScannerAdapter;
  private attendanceService: AttendanceService;

  private scanSuccessCallbacks: Set<(attendance: Attendance, payload: ScanPayload) => void> = new Set();
  private scanErrorCallbacks: Set<(error: Error, payload?: ScanPayload) => void> = new Set();

  constructor(
    attendanceService: AttendanceService,
    config?: Partial<ScannerConfig>
  ) {
    this.attendanceService = attendanceService;

    const debounceMs = config?.debounceMs ?? 1000;
    const soundEnabled = config?.soundFeedbackEnabled ?? true;

    this.debouncer = new HardwareDebouncer(debounceMs);
    this.feedbackEngine = new ScannerFeedbackEngine(soundEnabled);
    this.sessionManager = new ScannerSessionManager('USB');

    this.usbAdapter = new USBScannerAdapter({
      interKeyTimeoutMs: config?.interKeyTimeoutMs ?? 50,
      suffixKey: config?.suffixKey ?? 'Enter'
    });

    this.cameraAdapter = new CameraScannerAdapter();

    this.activeAdapter = this.usbAdapter;
    this.bindAdapterEvents(this.usbAdapter);
    this.bindAdapterEvents(this.cameraAdapter);
  }

  async initialize(preferredType: ScannerType = 'USB'): Promise<void> {
    await this.usbAdapter.initialize();
    await this.cameraAdapter.initialize();

    await this.switchScannerType(preferredType);
  }

  destroy(): void {
    this.usbAdapter.destroy();
    this.cameraAdapter.destroy();
    this.sessionManager.destroy();
    this.scanSuccessCallbacks.clear();
    this.scanErrorCallbacks.clear();
  }

  async switchScannerType(type: ScannerType): Promise<void> {
    if (type === 'CAMERA') {
      this.activeAdapter = this.cameraAdapter;
      this.sessionManager.setActiveScannerType('CAMERA');
      const currentStatus = this.cameraAdapter.getStatus();
      this.sessionManager.setConnectionStatus(currentStatus === 'CONNECTED' ? 'CONNECTED' : 'INITIALIZING');
    } else {
      this.cameraAdapter.stopCamera();
      this.activeAdapter = this.usbAdapter;
      this.sessionManager.setActiveScannerType('USB');
      this.sessionManager.setConnectionStatus(this.usbAdapter.getStatus());
    }
  }

  getCameraAdapter(): CameraScannerAdapter {
    return this.cameraAdapter;
  }

  getSessionState(): ScannerSessionState {
    return this.sessionManager.getState();
  }

  subscribeSessionState(callback: (state: ScannerSessionState) => void): () => void {
    return this.sessionManager.subscribe(callback);
  }

  onScanSuccess(callback: (attendance: Attendance, payload: ScanPayload) => void): () => void {
    this.scanSuccessCallbacks.add(callback);
    return () => this.scanSuccessCallbacks.delete(callback);
  }

  onScanError(callback: (error: Error, payload?: ScanPayload) => void): () => void {
    this.scanErrorCallbacks.add(callback);
    return () => this.scanErrorCallbacks.delete(callback);
  }

  setSoundEnabled(enabled: boolean): void {
    this.feedbackEngine.setSoundEnabled(enabled);
  }

  /**
   * Manual entry point or direct test invocation
   */
  async processManualToken(
    rawToken: string, 
    operatorId: string, 
    operatorNameSnapshot: string
  ): Promise<Attendance> {
    const payload: ScanPayload = {
      rawToken,
      normalizedToken: ScannerInputNormalizer.normalize(rawToken),
      timestamp: new Date(),
      scannerType: 'MANUAL',
      deviceId: 'MANUAL_ENTRY'
    };

    return this.handleIncomingScan(payload, operatorId, operatorNameSnapshot);
  }

  private bindAdapterEvents(adapter: IScannerAdapter): void {
    adapter.onScan((payload) => {
      // Only process scans from the currently active adapter
      if (adapter.scannerType === this.sessionManager.getState().activeScannerType) {
        this.handleIncomingScan(payload, 'SYSTEM_OPERATOR', 'Petugas Absensi');
      }
    });

    adapter.onStatusChange((status) => {
      if (adapter.scannerType === this.sessionManager.getState().activeScannerType) {
        this.sessionManager.setConnectionStatus(status);
      }
    });

    adapter.onError((error) => {
      if (adapter.scannerType === this.sessionManager.getState().activeScannerType) {
        this.sessionManager.setConnectionStatus('ERROR', error.message);
        this.scanErrorCallbacks.forEach(cb => cb(error));
      }
    });
  }

  private async handleIncomingScan(
    payload: ScanPayload, 
    operatorId: string, 
    operatorNameSnapshot: string
  ): Promise<Attendance> {
    this.sessionManager.recordScanAttempt();

    const normalizedToken = ScannerInputNormalizer.normalize(payload.rawToken);
    
    // Validate format
    if (!ScannerInputNormalizer.isValidTokenFormat(normalizedToken)) {
      const formatError = new Error(`Format barcode tidak valid: ${payload.rawToken}`);
      this.feedbackEngine.playError();
      this.sessionManager.recordScanFailure(formatError.message);
      this.scanErrorCallbacks.forEach(cb => cb(formatError, payload));
      throw formatError;
    }

    // Check hardware debouncer
    if (!this.debouncer.shouldAllowScan(normalizedToken)) {
      this.feedbackEngine.playWarning();
      const duplicateError = new Error('Scan diabaikan: Terdeteksi duplikasi hardware scan beruntun.');
      this.sessionManager.recordScanFailure(duplicateError.message);
      // We don't trigger full error popup for debounced duplicate scans, just subtle warning
      throw duplicateError;
    }

    const sourceMap: Record<ScannerType, AttendanceSource> = {
      'USB': 'USB_SCANNER',
      'CAMERA': 'CAMERA',
      'MANUAL': 'MANUAL'
    };

    try {
      const attendance = await this.attendanceService.processScan(
        normalizedToken,
        sourceMap[payload.scannerType] || 'USB_SCANNER',
        operatorId,
        operatorNameSnapshot
      );

      this.feedbackEngine.playSuccess();
      this.sessionManager.recordScanSuccess();
      this.scanSuccessCallbacks.forEach(cb => cb(attendance, payload));

      return attendance;
    } catch (error: any) {
      this.feedbackEngine.playError();
      this.sessionManager.recordScanFailure(error.message || 'Scan gagal diproses');
      this.scanErrorCallbacks.forEach(cb => cb(error, payload));
      throw error;
    }
  }
}
