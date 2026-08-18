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
  ticketId?: string;
  actionLabel?: string;
  actionUrl?: string;
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

  setNotifications(list: AdminNotification[], updateCount = true) {
    this.notificationsSubject.next(list);
    if (updateCount) {
      this.updateUnreadCount(list);
    }
  }

  addNotification(notification: AdminNotification) {
    const existing = this.notifications.find(
      (item) => item._id === notification._id,
    );
    const updated = [
      notification,
      ...this.notifications.filter((item) => item._id !== notification._id),
    ];
    this.notificationsSubject.next(updated);

    if (!existing && !notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    } else if (existing?.isRead && !notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    } else if (existing && !existing.isRead && notification.isRead) {
      this.unreadCountSubject.next(Math.max(this.unreadCountSubject.value - 1, 0));
    }
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((item) => item._id === id);
    const updated = this.notifications.map((n) =>
      n._id === id ? { ...n, isRead: true } : n,
    );

    this.notificationsSubject.next(updated);
    if (notification && !notification.isRead) {
      this.unreadCountSubject.next(Math.max(this.unreadCountSubject.value - 1, 0));
    }
  }

  markAllAsRead() {
    this.notificationsSubject.next(
      this.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );
    this.unreadCountSubject.next(0);
  }

  removeNotification(id: string) {
    const notification = this.notifications.find((item) => item._id === id);
    this.notificationsSubject.next(
      this.notifications.filter((item) => item._id !== id),
    );

    if (notification && !notification.isRead) {
      this.unreadCountSubject.next(Math.max(this.unreadCountSubject.value - 1, 0));
    }
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
