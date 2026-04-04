import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AdminNotificationService } from '../../services/admin-notification.service';
import { AdminNotificationStore } from '../../services/admin-notification.store';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  //  FULL STATE (from store)
  notifications$ = this.notificationStore.notifications$;

  //  DERIVED STATE (unread only)
  unreadNotifications$ = this.notifications$.pipe(
    map((list) => list.filter((n: any) => !n.isRead)),
  );

  private API = `${environment.apiBaseUrl}/admin`;

  constructor(
    private http: HttpClient,
    private notificationService: AdminNotificationService,
    private notificationStore: AdminNotificationStore,
  ) {}

  ngOnInit(): void {
    this.notificationStore.notifications$.pipe().subscribe((existing) => {
      if (existing && existing.length > 0) return;

      this.http.get(`${this.API}/notifications`).subscribe((res: any) => {
        const all = res?.data?.data || [];
        this.notificationStore.setNotifications(all);
      });
    });
  }

  createTest() {
    this.http.post(`${this.API}/notifications/test`, {}).subscribe();
  }

  markAsRead(id: string) {
    this.http
      .patch(`${this.API}/notifications/${id}/read`, {})
      .subscribe(() => {
        this.notificationStore.markAsRead(id);
      });
  }
}
