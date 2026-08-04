type ConnectivityListener = (isOnline: boolean) => void;

class ConnectivityService {
  private online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<ConnectivityListener> = new Set();
  private queuedAttendanceCount: number = 0;
  private queuedUploadsCount: number = 0;
  private lastSyncTime: Date | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
    }
  }

  public isOnline(): boolean {
    return this.online;
  }

  private setOnline(status: boolean) {
    this.online = status;
    this.notifyListeners();
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.online);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.online));
  }

  public updateQueuedCounts(attendance: number, uploads: number) {
    this.queuedAttendanceCount = attendance;
    this.queuedUploadsCount = uploads;
  }

  public getQueuedCounts() {
    return {
      attendance: this.queuedAttendanceCount,
      uploads: this.queuedUploadsCount,
      total: this.queuedAttendanceCount + this.queuedUploadsCount,
    };
  }

  public markSyncCompleted() {
    this.lastSyncTime = new Date();
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}

export const connectivityService = new ConnectivityService();
