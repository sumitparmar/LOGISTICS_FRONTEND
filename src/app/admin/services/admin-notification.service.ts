import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminNotificationService {
  private API = `${environment.apiBaseUrl}/admin`;

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  constructor(private http: HttpClient) {}

  fetchUnreadCount() {
    this.http.get(`${this.API}/notifications`).subscribe((res: any) => {
      const unread = res.data.data.filter((n: any) => !n.isRead).length;
      this._unreadCount.next(unread);
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
}
