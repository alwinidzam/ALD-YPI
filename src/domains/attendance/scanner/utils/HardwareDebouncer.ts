export class HardwareDebouncer {
  private lastScanMap: Map<string, number> = new Map();
  private globalLastScanTime: number = 0;

  constructor(
    private defaultWindowMs: number = 1000,
    private globalThrottleMs: number = 300
  ) {}

  /**
   * Checks whether a scan payload should be allowed or discarded as a hardware duplicate.
   * @param token Normalized barcode token
   * @param windowMs Custom debounce window in milliseconds
   * @returns true if scan is valid and allowed; false if it's a duplicate/throttled scan.
   */
  shouldAllowScan(token: string, windowMs?: number): boolean {
    const now = Date.now();
    const effectiveWindow = windowMs ?? this.defaultWindowMs;

    // Global throttle check (prevents hardware double-firing under 300ms)
    if (now - this.globalLastScanTime < this.globalThrottleMs) {
      return false;
    }

    // Token-specific debounce check
    const lastTime = this.lastScanMap.get(token);
    if (lastTime && now - lastTime < effectiveWindow) {
      return false;
    }

    // Record scan timestamp
    this.globalLastScanTime = now;
    this.lastScanMap.set(token, now);

    // Garbage collection of old map entries (> 1 minute)
    if (this.lastScanMap.size > 100) {
      this.cleanupOldEntries(now);
    }

    return true;
  }

  /**
   * Resets debounce state for a specific token or all tokens.
   */
  reset(token?: string): void {
    if (token) {
      this.lastScanMap.delete(token);
    } else {
      this.lastScanMap.clear();
      this.globalLastScanTime = 0;
    }
  }

  private cleanupOldEntries(now: number): void {
    const maxAge = 60000; // 1 minute
    for (const [key, timestamp] of this.lastScanMap.entries()) {
      if (now - timestamp > maxAge) {
        this.lastScanMap.delete(key);
      }
    }
  }
}
