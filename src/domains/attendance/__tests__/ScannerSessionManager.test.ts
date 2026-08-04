import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScannerSessionManager } from '../scanner/services/ScannerSessionManager';

describe('ScannerSessionManager', () => {
  let manager: ScannerSessionManager;

  beforeEach(() => {
    manager = new ScannerSessionManager('USB');
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should initialize with correct default state', () => {
    const state = manager.getState();
    expect(state.sessionId).toBeDefined();
    expect(state.activeScannerType).toBe('USB');
    expect(state.connectionStatus).toBe('DISCONNECTED');
    expect(state.totalScanCount).toBe(0);
  });

  it('should allow subscribing to state changes', () => {
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);
    
    // Called once initially
    expect(listener).toHaveBeenCalledTimes(1);
    
    manager.setActiveScannerType('CAMERA');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].activeScannerType).toBe('CAMERA');
    
    unsubscribe();
    manager.setActiveScannerType('USB');
    expect(listener).toHaveBeenCalledTimes(2); // Should not be called again
  });

  it('should track scan statistics', () => {
    manager.recordScanAttempt();
    expect(manager.getState().totalScanCount).toBe(1);
    expect(manager.getState().lastScanTimestamp).toBeDefined();

    manager.recordScanSuccess();
    expect(manager.getState().successfulScanCount).toBe(1);
    
    manager.recordScanFailure('Read error');
    expect(manager.getState().failedScanCount).toBe(1);
    expect(manager.getState().lastErrorMessage).toBe('Read error');
  });

  it('should reset session and statistics', () => {
    manager.recordScanAttempt();
    manager.recordScanSuccess();
    
    manager.resetSession();
    
    const state = manager.getState();
    expect(state.totalScanCount).toBe(0);
    expect(state.successfulScanCount).toBe(0);
    expect(state.failedScanCount).toBe(0);
  });

  it('should update connection status', () => {
    manager.setConnectionStatus('CONNECTED');
    expect(manager.getState().connectionStatus).toBe('CONNECTED');
    
    manager.setConnectionStatus('ERROR', 'Camera not found');
    expect(manager.getState().connectionStatus).toBe('ERROR');
    expect(manager.getState().lastErrorMessage).toBe('Camera not found');
  });
});
