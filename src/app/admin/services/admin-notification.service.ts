import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AdminNotificationStore } from './admin-notification.store';
@Injectable({
  providedIn: 'root',
})
export class AdminNotificationService {
  private API = `${environment.apiBaseUrl}/admin`;

  private _unreadCount = new BehaviorSubject<number>(0);
  private unreadRequest$: Observable<any> | null = null;
  private lastUnreadFetchAt = 0;
  unreadCount$ = this._unreadCount.asObservable();

  constructor(
    private http: HttpClient,
    private notificationStore: AdminNotificationStore,
  ) {}

  fetchUnreadCount(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastUnreadFetchAt < 15000) return;
    if (this.unreadRequest$) return;

    this.unreadRequest$ = this.http
      .get(`${this.API}/notifications/unread-count`)
      .pipe(
        tap((res: any) => {
          const unread = Number(res?.count || 0);
          this.lastUnreadFetchAt = Date.now();
          this._unreadCount.next(unread);
          this.notificationStore.setUnreadCount(unread);
        }),
        catchError(() => of(null)),
        finalize(() => (this.unreadRequest$ = null)),
      );
    this.unreadRequest$.subscribe();
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
