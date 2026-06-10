import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CustomerNotification,
  CustomerNotificationService,
} from '../../services/customer-notification.service';
import { NotificationStateService } from 'src/app/shared/services/notification-state.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  notifications: CustomerNotification[] = [];

  loading = false;

  constructor(
    private notificationService: CustomerNotificationService,
    private router: Router,
    private notificationState: NotificationStateService,
  ) {}
  ngOnInit(): void {
    this.loadNotifications();
  }

  get totalCount(): number {
    return this.notifications.length;
  }

  get readCount(): number {
    return this.notifications.filter((x) => x.isRead).length;
  }

  get unreadCount(): number {
    return this.notifications.filter((x) => !x.isRead).length;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'ORDER_CREATED':
        return '📦';

      case 'ORDER_STATUS':
        return '🚚';

      case 'ORDER_DELIVERED':
        return '✅';

      case 'ORDER_CANCELLED':
        return '❌';

      default:
        return '🔔';
    }
  }

  getNotificationLabel(type: string): string {
    switch (type) {
      case 'ORDER_CREATED':
        return 'Order Created';

      case 'ORDER_STATUS':
        return 'Order Status';

      case 'ORDER_DELIVERED':
        return 'Delivered';

      case 'ORDER_CANCELLED':
        return 'Cancelled';

      default:
        return 'Notification';
    }
  }

  loadNotifications(): void {
    this.loading = true;

    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data || [];
        this.notificationState.setUnreadCount(
          this.notifications.filter((x) => !x.isRead).length,
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  markAsRead(notification: CustomerNotification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService.markAsRead(notification._id).subscribe(() => {
      notification.isRead = true;

      this.notificationState.setUnreadCount(
        this.notifications.filter((x) => !x.isRead).length,
      );
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((notification) => {
          notification.isRead = true;
        });
        this.notificationState.setUnreadCount(0);
      },
    });
  }

  openNotification(notification: CustomerNotification): void {
    this.markAsRead(notification);

    if (notification.order && notification.order._id) {
      this.router.navigate(['/app/orders', notification.order._id]);
    }
  }
}
