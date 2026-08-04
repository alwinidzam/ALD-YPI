export type HapticType = 
  | 'success'
  | 'warning'
  | 'error'
  | 'notification'
  | 'click'
  | 'scanSuccess'
  | 'scanFailure'
  | 'confirmation'
  | 'softConfirmation';

class HapticService {
  private enabled: boolean = true;
  private supported: boolean = false;

  constructor() {
    this.supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public isSupported(): boolean {
    return this.supported;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled && this.supported;
  }

  public trigger(type: HapticType) {
    if (!this.isEnabled()) return;

    try {
      switch (type) {
        case 'click':
          navigator.vibrate(12);
          break;
        case 'scanSuccess':
        case 'success':
          navigator.vibrate(30);
          break;
        case 'warning':
          // Double pulse
          navigator.vibrate([40, 50, 40]);
          break;
        case 'scanFailure':
        case 'error':
          // Long vibration
          navigator.vibrate(100);
          break;
        case 'notification':
          // Gentle pulse
          navigator.vibrate([25, 30, 25]);
          break;
        case 'confirmation':
          // Confirmation pattern
          navigator.vibrate([30, 40, 60]);
          break;
        case 'softConfirmation':
          // Soft confirmation pattern
          navigator.vibrate([20, 30, 20]);
          break;
        default:
          navigator.vibrate(15);
          break;
      }
    } catch (e) {
      // Ignore vibration errors on browsers with restricted permissions
    }
  }
}

export const hapticService = new HapticService();
