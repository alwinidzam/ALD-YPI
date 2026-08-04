import { FeedbackType, feedbackService } from './FeedbackService';

export interface ToastOptions {
  id?: string;
  message: string;
  type: FeedbackType;
  duration?: number;
  persistent?: boolean;
}

type Listener = (toasts: ToastOptions[]) => void;

class ToastManager {
  private toasts: ToastOptions[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l([...this.toasts]));
  }

  show(options: Omit<ToastOptions, 'id'>): string {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { ...options, id };
    
    this.toasts = [...this.toasts, toast];
    this.notifyListeners();

    if (toast.type !== 'info') {
      feedbackService.notify(toast.type);
    } else {
      feedbackService.playSound('info');
    }

    if (!toast.persistent) {
      setTimeout(() => {
        this.hide(id);
      }, toast.duration || 4000);
    }

    return id;
  }

  hide(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notifyListeners();
  }

  success(message: string) { return this.show({ message, type: 'success' }); }
  error(message: string) { return this.show({ message, type: 'error' }); }
  warning(message: string) { return this.show({ message, type: 'warning' }); }
  info(message: string) { return this.show({ message, type: 'info' }); }
  
  loading(message: string) {
    return this.show({ message, type: 'info', persistent: true });
  }
  
  completeLoading(id: string, message: string, type: FeedbackType = 'complete') {
    this.toasts = this.toasts.map(t => t.id === id ? { ...t, message, type, persistent: false, duration: 3000 } : t);
    this.notifyListeners();
    feedbackService.notify(type);
    setTimeout(() => {
      this.hide(id);
    }, 3000);
  }
}

export const toast = new ToastManager();
