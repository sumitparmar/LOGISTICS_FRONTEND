import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;

  // 🔷 OPTIONAL (non-breaking)
  title?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast>();
  toast$ = this.toastSubject.asObservable();

  show(toast: Toast) {
    this.toastSubject.next(toast);
  }

  success(message: string) {
    this.show({ type: 'success', message });
  }

  error(message: string) {
    this.show({ type: 'error', message });
  }

  showNotification(notification: any) {
    this.show({
      type: 'info',
      message: notification.message,
      title: notification.title,
      priority: notification.priority,
    });
  }
}
