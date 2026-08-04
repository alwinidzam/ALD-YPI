export interface DeviceCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  hasTouch: boolean;
  hasHaptics: boolean;
  hasCamera: boolean;
  hasNotificationSupport: boolean;
  supportsPWA: boolean;
  deviceMemoryGbs?: number;
  cpuCores?: number;
  performanceTier: 'low' | 'medium' | 'high';
}

class DeviceCapabilityService {
  private capabilities: DeviceCapabilities;

  constructor() {
    this.capabilities = this.detectCapabilities();
  }

  private detectCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isTablet: false,
        hasTouch: false,
        hasHaptics: false,
        hasCamera: false,
        hasNotificationSupport: false,
        supportsPWA: false,
        performanceTier: 'high',
      };
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch)))/i.test(ua);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = (isIOS || isAndroid || hasTouch) && !isTablet;

    const hasHaptics = 'vibrate' in navigator;
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasNotificationSupport = 'Notification' in window && 'serviceWorker' in navigator;
    const supportsPWA = 'serviceWorker' in navigator;

    const deviceMemoryGbs = (navigator as any).deviceMemory || 4;
    const cpuCores = navigator.hardwareConcurrency || 4;

    let performanceTier: 'low' | 'medium' | 'high' = 'high';
    if (deviceMemoryGbs <= 2 || cpuCores <= 2) {
      performanceTier = 'low';
    } else if (deviceMemoryGbs <= 4 || cpuCores <= 4) {
      performanceTier = 'medium';
    }

    return {
      isMobile,
      isIOS,
      isAndroid,
      isTablet,
      hasTouch,
      hasHaptics,
      hasCamera,
      hasNotificationSupport,
      supportsPWA,
      deviceMemoryGbs,
      cpuCores,
      performanceTier,
    };
  }

  public getCapabilities(): DeviceCapabilities {
    return this.capabilities;
  }
}

export const deviceCapabilityService = new DeviceCapabilityService();
