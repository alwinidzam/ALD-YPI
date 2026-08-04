import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CameraScannerAdapter } from '../../scanner/adapters/CameraScannerAdapter';

describe('CameraScannerAdapter', () => {
  let adapter: CameraScannerAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = new CameraScannerAdapter();
  });

  afterEach(() => {
    vi.useRealTimers();
    adapter.destroy();
    vi.unstubAllGlobals();
  });

  it('should fail initialization if MediaDevices API not supported', async () => {
    vi.stubGlobal('navigator', {});
    
    const errorCb = vi.fn();
    adapter.onError(errorCb);
    
    await adapter.initialize();
    
    expect(adapter.getStatus()).toBe('ERROR');
    expect(errorCb).toHaveBeenCalled();
  });

  it('should initialize successfully and setup BarcodeDetector if available', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {} });
    
    const mockBarcodeDetector = vi.fn();
    vi.stubGlobal('BarcodeDetector', mockBarcodeDetector);
    
    await adapter.initialize();
    
    expect(adapter.getStatus()).toBe('INITIALIZING');
    expect(mockBarcodeDetector).toHaveBeenCalled();
  });

  it('should start camera and begin frame loop', async () => {
    const mockStream = { getTracks: () => [], getVideoTracks: () => [] };
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream)
      }
    });

    const videoEl = { play: vi.fn().mockResolvedValue(undefined), srcObject: null };
    adapter.setVideoElement(videoEl as any);
    
    await adapter.initialize();
    await adapter.startCamera();
    
    expect(videoEl.srcObject).toBe(mockStream);
    expect(videoEl.play).toHaveBeenCalled();
    expect(adapter.getStatus()).toBe('CONNECTED');
    
    // cleanup
    adapter.stopCamera();
  });

  it('should emit error when startCamera fails', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Denied'))
      }
    });

    const errorCb = vi.fn();
    adapter.onError(errorCb);
    
    await adapter.initialize();
    
    await expect(adapter.startCamera()).rejects.toThrow('Failed to access camera');
    expect(adapter.getStatus()).toBe('ERROR');
    expect(errorCb).toHaveBeenCalled();
  });

  it('should process frames and emit scan when barcode detected', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [], getVideoTracks: () => [] }) } });
    
    const mockDetect = vi.fn().mockResolvedValue([{ rawValue: 'YPI-123' }]);
    vi.stubGlobal('BarcodeDetector', class {
      detect = mockDetect;
    });
    vi.stubGlobal('requestAnimationFrame', (cb: any) => setTimeout(cb, 16));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    
    const videoEl = { readyState: 2, play: vi.fn().mockResolvedValue(undefined), srcObject: null };
    adapter.setVideoElement(videoEl as any);
    
    const scanCb = vi.fn();
    adapter.onScan(scanCb);

    await adapter.initialize();
    await adapter.startCamera();
    
    // Advance timers past scan interval (200ms)
    vi.advanceTimersByTime(250);
    
    // Wait for promise microtasks from detect()
    await Promise.resolve();
    await Promise.resolve();
    
    expect(mockDetect).toHaveBeenCalled();
    expect(scanCb).toHaveBeenCalled();
    expect(scanCb.mock.calls[0][0].rawToken).toBe('YPI-123');
  });

  it('should stop camera and clean up', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack], getVideoTracks: () => [mockTrack] };
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream)
      }
    });

    const videoEl = { play: vi.fn().mockResolvedValue(undefined), srcObject: null };
    adapter.setVideoElement(videoEl as any);
    
    await adapter.startCamera();
    adapter.stopCamera();
    
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(videoEl.srcObject).toBeNull();
    expect(adapter.getStatus()).toBe('DISCONNECTED');
  });
});
