import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { USBScannerAdapter } from '../../scanner/adapters/USBScannerAdapter';

describe('USBScannerAdapter', () => {
  let adapter: USBScannerAdapter;
  let mockTarget: any;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTarget = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    adapter = new USBScannerAdapter({ targetElement: mockTarget, interKeyTimeoutMs: 50 });
  });

  afterEach(() => {
    vi.useRealTimers();
    adapter.destroy();
  });

  it('should initialize and attach event listeners', async () => {
    // we need to stub window since it checks `typeof window`
    vi.stubGlobal('window', { clearTimeout: vi.fn(), setTimeout: vi.fn() });
    await adapter.initialize();
    expect(mockTarget.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(adapter.getStatus()).toBe('CONNECTED');
    vi.unstubAllGlobals();
  });

  it('should process rapid keydown events as a scan', async () => {
    vi.stubGlobal('window', { clearTimeout: vi.fn(), setTimeout: vi.fn() });
    await adapter.initialize();
    
    const handler = mockTarget.addEventListener.mock.calls[0][1];
    
    const scanCb = vi.fn();
    adapter.onScan(scanCb);

    // simulate keys 'A', 'B', 'C', 'D', 'Enter'
    const eventA = { key: 'A', target: {} };
    const eventB = { key: 'B', target: {} };
    const eventC = { key: 'C', target: {} };
    const eventD = { key: 'D', target: {} };
    const eventEnter = { key: 'Enter', target: {}, preventDefault: vi.fn() };

    handler(eventA);
    vi.advanceTimersByTime(10);
    handler(eventB);
    vi.advanceTimersByTime(10);
    handler(eventC);
    vi.advanceTimersByTime(10);
    handler(eventD);
    vi.advanceTimersByTime(10);
    handler(eventEnter);

    expect(scanCb).toHaveBeenCalledTimes(1);
    expect(scanCb.mock.calls[0][0].rawToken).toBe('ABCD');
    expect(scanCb.mock.calls[0][0].normalizedToken).toBe('ABCD');
    vi.unstubAllGlobals();
  });

  it('should ignore slow typing', async () => {
    vi.stubGlobal('window', { clearTimeout: vi.fn(), setTimeout: vi.fn() });
    await adapter.initialize();
    
    const handler = mockTarget.addEventListener.mock.calls[0][1];
    
    const scanCb = vi.fn();
    adapter.onScan(scanCb);

    const eventA = { key: 'A', target: {} };
    const eventB = { key: 'B', target: {} };
    const eventC = { key: 'C', target: {} };
    const eventD = { key: 'D', target: {} };
    const eventEnter = { key: 'Enter', target: {} };

    handler(eventA);
    vi.advanceTimersByTime(100); // 100ms gap > 50ms interKeyTimeout
    handler(eventB);
    vi.advanceTimersByTime(10);
    handler(eventC);
    vi.advanceTimersByTime(10);
    handler(eventD);
    vi.advanceTimersByTime(10);
    handler(eventEnter);

    // Buffer should be reset before 'B', so token is 'BCD' which is length 3, less than 4, so no scan emitted
    expect(scanCb).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should auto clear buffer on timeout', async () => {
    vi.stubGlobal('window', { clearTimeout: vi.fn(), setTimeout: (cb: any) => setTimeout(cb, 200) });
    await adapter.initialize();
    
    const handler = mockTarget.addEventListener.mock.calls[0][1];
    const eventA = { key: 'A', target: {} };
    
    handler(eventA);
    vi.advanceTimersByTime(250); // wait for auto clear timeout
    
    // Now even if we type 'B', 'C', 'D', 'E', 'Enter' fast, 'A' should be gone
    const scanCb = vi.fn();
    adapter.onScan(scanCb);
    
    handler({ key: 'B', target: {} });
    handler({ key: 'Enter', target: {} });
    
    expect(scanCb).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
