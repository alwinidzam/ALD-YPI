import { IScannerAdapter, ScanPayload, ScannerConnectionStatus, ScannerType } from '../types';
import { ScannerInputNormalizer } from '../utils/ScannerInputNormalizer';

export interface USBScannerOptions {
  interKeyTimeoutMs?: number; // Max ms between chars to count as scanner input (e.g. 50ms)
  suffixKey?: string; // Key indicating end of scan (e.g. 'Enter')
  targetElement?: HTMLElement | Window;
}

export class USBScannerAdapter implements IScannerAdapter {
  readonly scannerType: ScannerType = 'USB';
  
  private status: ScannerConnectionStatus = 'DISCONNECTED';
  private buffer: string = '';
  private lastKeyTime: number = 0;
  private timer: number | null = null;
  
  private scanCallbacks: Set<(payload: ScanPayload) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private statusCallbacks: Set<(status: ScannerConnectionStatus) => void> = new Set();

  private interKeyTimeoutMs: number;
  private suffixKey: string;
  private target: HTMLElement | Window;

  constructor(options?: USBScannerOptions) {
    this.interKeyTimeoutMs = options?.interKeyTimeoutMs ?? 50;
    this.suffixKey = options?.suffixKey ?? 'Enter';
    this.target = options?.targetElement ?? (typeof window !== 'undefined' ? window : ({} as any));
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.target.addEventListener('keydown', this.handleKeyDown as EventListener);
    this.setStatus('CONNECTED');
  }

  destroy(): void {
    if (typeof window === 'undefined') return;

    this.target.removeEventListener('keydown', this.handleKeyDown as EventListener);
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer = '';
    this.setStatus('DISCONNECTED');
  }

  getStatus(): ScannerConnectionStatus {
    return this.status;
  }

  onScan(callback: (payload: ScanPayload) => void): () => void {
    this.scanCallbacks.add(callback);
    return () => this.scanCallbacks.delete(callback);
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onStatusChange(callback: (status: ScannerConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private setStatus(newStatus: ScannerConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusCallbacks.forEach(cb => cb(newStatus));
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ignore input if user is actively typing in an editable field (input, textarea) unless desired
    const targetEl = event.target as HTMLElement;
    const isInputElement = targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.isContentEditable);
    
    // If it's a standard text input, USB scanner keystrokes still fire fast. We check inter-character timing.
    const now = Date.now();
    const timeDiff = now - this.lastKeyTime;
    this.lastKeyTime = now;

    // Reset buffer if typing speed is human (> 80ms delay between keys)
    if (timeDiff > this.interKeyTimeoutMs && this.buffer.length > 0) {
      this.buffer = '';
    }

    if (event.key === this.suffixKey) {
      if (this.buffer.length >= 4) {
        // High likelihood of a barcode scan
        const rawToken = this.buffer;
        const normalizedToken = ScannerInputNormalizer.normalize(rawToken);

        if (normalizedToken) {
          // Prevent submitting form or inserting enter key if in input element
          if (isInputElement) {
            event.preventDefault();
          }

          const payload: ScanPayload = {
            rawToken,
            normalizedToken,
            timestamp: new Date(),
            scannerType: 'USB',
            deviceId: 'HID_USB_BARCODE_READER',
          };

          this.scanCallbacks.forEach(cb => cb(payload));
        }
      }
      this.buffer = '';
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
      }
      return;
    }

    // Accumulate printable characters only
    if (event.key.length === 1) {
      this.buffer += event.key;

      // Auto-clear buffer if no new keys arrive within timeout
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        this.buffer = '';
      }, 200);
    }
  };
}
