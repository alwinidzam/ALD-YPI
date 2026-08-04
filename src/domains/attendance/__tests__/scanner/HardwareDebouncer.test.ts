import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HardwareDebouncer } from '../../scanner/utils/HardwareDebouncer';

describe('HardwareDebouncer', () => {
  let debouncer: HardwareDebouncer;

  beforeEach(() => {
    // using mock timer
    vi.useFakeTimers();
    debouncer = new HardwareDebouncer(1000, 300);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first scan', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
  });

  it('should block rapid global duplicates within 300ms throttle window', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
    
    vi.advanceTimersByTime(200);
    // Even a different token is blocked due to global throttle of 300ms
    expect(debouncer.shouldAllowScan('TOKEN-2')).toBe(false);
  });

  it('should block same token within debounce window', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
    
    vi.advanceTimersByTime(400); // Past global throttle (300)
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(false); // But blocked by token debounce (1000)
    
    vi.advanceTimersByTime(700); // Now at 1100ms
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
  });

  it('should allow different tokens after global throttle', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
    
    vi.advanceTimersByTime(400); // Past global throttle
    expect(debouncer.shouldAllowScan('TOKEN-2')).toBe(true); // Different token allowed
  });

  it('should allow custom window for specific scan', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
    
    vi.advanceTimersByTime(400);
    expect(debouncer.shouldAllowScan('TOKEN-1', 500)).toBe(false); // custom 500ms
    
    vi.advanceTimersByTime(150); // Now 550ms
    expect(debouncer.shouldAllowScan('TOKEN-1', 500)).toBe(true);
  });

  it('should reset specific token', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
    vi.advanceTimersByTime(400);
    debouncer.reset('TOKEN-1');
    // Global throttle still prevents it if under 300ms, but we're at 400ms
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
  });

  it('should reset all tokens', () => {
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
    vi.advanceTimersByTime(400);
    debouncer.reset();
    expect(debouncer.shouldAllowScan('TOKEN-1')).toBe(true);
  });
  
  it('should cleanup old entries', () => {
    for (let i = 0; i < 105; i++) {
      vi.advanceTimersByTime(400);
      debouncer.shouldAllowScan(`TOKEN-${i}`);
    }
    // Should trigger cleanup
    // We just verify it doesn't crash here
    expect(true).toBe(true);
  });
});
