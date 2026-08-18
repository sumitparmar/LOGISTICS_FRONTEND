import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AdminNotificationStore } from './admin-notification.store';
@Injectable({
  providedIn: 'root',
})
export class AdminNotificationService {
  private API = `${environment.apiBaseUrl}/admin`;

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  constructor(
    private http: HttpClient,
    private notificationStore: AdminNotificationStore,
  ) {}

  fetchUnreadCount() {
    this.http
      .get(`${this.API}/notifications/unread-count`)
      .subscribe({
        next: (res: any) => {
          const unread = Number(res?.count || 0);
          this._unreadCount.next(unread);
          this.notificationStore.setUnreadCount(unread);
        },
        error: () => {
          this._unreadCount.next(0);
        },
      });
  }

  decrementCount() {
    const current = this._unreadCount.value;
    this._unreadCount.next(Math.max(current - 1, 0));
  }
  markAsRead(id: string) {
    return this.http.patch(
      `${environment.apiBaseUrl}/admin/notifications/${id}/read`,
      {},
    );
  }

  markAllAsRead() {
    return this.http.patch(`${this.API}/notifications/read-all`, {});
  }

  deleteNotification(id: string) {
    return this.http.delete(`${this.API}/notifications/${id}`);
  }

  fetchNotifications(params: Record<string, string | number | boolean> = {}) {
    return this.http.get(`${this.API}/notifications`, {
      params: new HttpParams({
        fromObject: Object.entries(params).reduce(
          (result, [key, value]) => ({ ...result, [key]: String(value) }),
          {} as Record<string, string>,
        ),
      }),
    });
  }

  incrementCount() {
    const current = this._unreadCount.value;
    this._unreadCount.next(current + 1);
  }

  fetchAllNotifications() {
    this.fetchNotifications({ page: 1, limit: 20 }).subscribe({
      next: (res: any) => {
        const list = res?.data?.data || [];
        this.notificationStore.setNotifications(list, false);
      },
    });
  }
}
