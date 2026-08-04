export type NotificationCategory = 'attendance' | 'documents' | 'announcements' | 'reports' | 'system';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  deepLink?: string;
  actionText?: string;
  icon?: string;
}

export interface NotificationSettingsConfig {
  enabled: boolean;
  attendance: boolean;
  documents: boolean;
  announcements: boolean;
  reports: boolean;
  system: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Set<(notifications: AppNotification[]) => void> = new Set();
  private settings: NotificationSettingsConfig = {
    enabled: true,
    attendance: true,
    documents: true,
    announcements: true,
    reports: true,
    system: true,
    soundEnabled: true,
    vibrateEnabled: true,
  };

  constructor() {
    this.loadSettings();
    // Default initial notifications if empty
    this.notifications = [
      {
        id: 'notif_1',
        category: 'attendance',
        title: 'Check In Berhasil',
        body: 'Guru baru melakukan Check In di unit RA.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        read: false,
        deepLink: 'attendance',
      },
      {
        id: 'notif_2',
        category: 'documents',
        title: 'Dokumen Diverifikasi',
        body: 'Dokumen SK Pengangkatan berhasil diverifikasi oleh Admin.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        deepLink: 'documents',
      },
      {
        id: 'notif_3',
        category: 'system',
        title: 'Sinkronisasi Offline Selesai',
        body: '3 entri absensi lokal telah disinkronkan ke cloud.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        read: true,
      }
    ];
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('notification_settings_v1');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }

  public saveSettings(newSettings: Partial<NotificationSettingsConfig>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('notification_settings_v1', JSON.stringify(this.settings));
    } catch (e) {}
  }

  public getSettings(): NotificationSettingsConfig {
    return this.settings;
  }

  public subscribe(listener: (notifications: AppNotification[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn([...this.notifications]));
    this.updateAppBadge();
  }

  public updateAppBadge() {
    const unreadCount = this.getUnreadCount();
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }

  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.notifyListeners();
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.notifyListeners();
  }

  public sendNotification(
    category: NotificationCategory,
    title: string,
    body: string,
    options?: { deepLink?: string; actionText?: string }
  ) {
    if (!this.settings.enabled || !this.settings[category]) {
      return;
    }

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      title,
      body,
      timestamp: new Date(),
      read: false,
      deepLink: options?.deepLink,
      actionText: options?.actionText,
    };

    this.notifications = [newNotif, ...this.notifications];
    this.notifyListeners();

    // Browser Web Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
        });
      } catch (e) {}
    }
  }
}

export const notificationService = new NotificationService();
