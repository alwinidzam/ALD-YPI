export type PermissionType = 'camera' | 'microphone' | 'notifications' | 'geolocation';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

class PermissionService {
  public async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    if (typeof window === 'undefined' || !navigator.permissions) {
      return 'unsupported';
    }

    try {
      if (type === 'notifications') {
        if (!('Notification' in window)) return 'unsupported';
        const state = Notification.permission;
        if (state === 'granted') return 'granted';
        if (state === 'denied') return 'denied';
        return 'prompt';
      }

      const permissionName = type as PermissionName;
      const result = await navigator.permissions.query({ name: permissionName });
      return result.state as PermissionStatus;
    } catch (e) {
      return 'prompt';
    }
  }

  public async requestNotificationPermission(): Promise<PermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const res = await Notification.requestPermission();
      return res as PermissionStatus;
    } catch (e) {
      return 'denied';
    }
  }

  public async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const permissionService = new PermissionService();
