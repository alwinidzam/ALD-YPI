import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedScannerService } from '../../scanner/services/UnifiedScannerService';
import { AttendanceService } from '../../services/AttendanceService';
import { ScanPayload, ScannerType } from '../../scanner/types';

describe('UnifiedScannerService', () => {
  let scannerService: UnifiedScannerService;
  let mockAttendanceService: any;
  let mockUsbAdapter: any;
  let mockCameraAdapter: any;

  beforeEach(() => {
    mockAttendanceService = {
      processScan: vi.fn(),
    };

    scannerService = new UnifiedScannerService(mockAttendanceService as unknown as AttendanceService);
    
    // Hack to mock adapters internally
    mockUsbAdapter = {
      initialize: vi.fn(),
      destroy: vi.fn(),
      scannerType: 'USB',
      getStatus: vi.fn().mockReturnValue('CONNECTED'),
      onScan: vi.fn(),
      onStatusChange: vi.fn(),
      onError: vi.fn(),
    };
    
    mockCameraAdapter = {
      initialize: vi.fn(),
      destroy: vi.fn(),
      stopCamera: vi.fn(),
      scannerType: 'CAMERA',
      getStatus: vi.fn().mockReturnValue('DISCONNECTED'),
      onScan: vi.fn(),
      onStatusChange: vi.fn(),
      onError: vi.fn(),
    };

    (scannerService as any).usbAdapter = mockUsbAdapter;
    (scannerService as any).cameraAdapter = mockCameraAdapter;
    (scannerService as any).activeAdapter = mockUsbAdapter;
  });

  it('should initialize both adapters', async () => {
    await scannerService.initialize('USB');
    expect(mockUsbAdapter.initialize).toHaveBeenCalled();
    expect(mockCameraAdapter.initialize).toHaveBeenCalled();
  });

  it('should switch scanner type', async () => {
    await scannerService.switchScannerType('CAMERA');
    expect((scannerService as any).activeAdapter).toBe(mockCameraAdapter);
    
    await scannerService.switchScannerType('USB');
    expect((scannerService as any).activeAdapter).toBe(mockUsbAdapter);
    expect(mockCameraAdapter.stopCamera).toHaveBeenCalled();
  });

  it('should get session state', () => {
    const state = scannerService.getSessionState();
    expect(state).toBeDefined();
    expect(state.activeScannerType).toBe('USB'); // default
  });
  
  it('should get camera adapter', () => {
    expect(scannerService.getCameraAdapter()).toBeDefined();
  });

  it('should subscribe and unsubscribe session state', () => {
    const fn = vi.fn();
    const unsub = scannerService.subscribeSessionState(fn);
    expect(fn).toHaveBeenCalled();
    unsub();
  });

  it('should bind scan callbacks and handle processScan success', async () => {
    const mockAttendance = { id: 'a1', status: 'CHECKED_IN' };
    mockAttendanceService.processScan.mockResolvedValue(mockAttendance);
    
    const successCb = vi.fn();
    scannerService.onScanSuccess(successCb);

    const payload: ScanPayload = {
      rawToken: 'YPI-123',
      normalizedToken: 'YPI-123',
      timestamp: new Date(),
      scannerType: 'MANUAL',
      deviceId: 'MANUAL'
    };

    const res = await scannerService.processManualToken('YPI-123', 'op1', 'Operator');
    expect(res).toEqual(mockAttendance);
    expect(successCb).toHaveBeenCalledWith(mockAttendance, expect.any(Object));
  });

  it('should handle processScan error', async () => {
    const mockError = new Error('Not found');
    mockAttendanceService.processScan.mockRejectedValue(mockError);
    
    const errorCb = vi.fn();
    scannerService.onScanError(errorCb);

    await expect(scannerService.processManualToken('YPI-123', 'op1', 'Operator'))
      .rejects.toThrow('Not found');

    expect(errorCb).toHaveBeenCalledWith(mockError, expect.any(Object));
  });

  it('should reject invalid token formats', async () => {
    await expect(scannerService.processManualToken('!@#', 'op1', 'Operator'))
      .rejects.toThrow('Format barcode tidak valid');
  });

  it('should destroy gracefully', () => {
    scannerService.destroy();
    expect(mockUsbAdapter.destroy).toHaveBeenCalled();
    expect(mockCameraAdapter.destroy).toHaveBeenCalled();
  });
});
