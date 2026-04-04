import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminNotificationStore {
  private notificationsSubject = new BehaviorSubject<AdminNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private get notifications(): AdminNotification[] {
    return this.notificationsSubject.getValue();
  }

  setNotifications(list: AdminNotification[]) {
    this.notificationsSubject.next(list);
    this.updateUnreadCount(list);
  }

  addNotification(notification: AdminNotification) {
    const updated = [notification, ...this.notifications];
    this.notificationsSubject.next(updated);

    if (!notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
  }

  markAsRead(id: string) {
    const updated = this.notifications.map((n) =>
      n._id === id ? { ...n, isRead: true } : n,
    );

    this.notificationsSubject.next(updated);
    this.updateUnreadCount(updated);
  }

  setUnreadCount(count: number) {
    this.unreadCountSubject.next(count);
  }

  decrement() {
    const current = this.unreadCountSubject.value;
    if (current > 0) {
      this.unreadCountSubject.next(current - 1);
    }
  }

  increment() {
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  private updateUnreadCount(list: AdminNotification[]) {
    const count = list.filter((n) => !n.isRead).length;
    this.unreadCountSubject.next(count);
  }
}
