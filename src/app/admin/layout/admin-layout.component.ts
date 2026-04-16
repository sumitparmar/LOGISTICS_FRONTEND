import { Component, OnInit } from '@angular/core';
import { AdminSocketService } from '../services/admin-socket.service';
import { OrdersStore } from '../services/admin-orders.store';
import { AdminNotificationStore } from '../services/admin-notification.store';
import { HostListener } from '@angular/core';
import { AdminNotificationService } from '../services/admin-notification.service';
import { Router, NavigationStart } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  unreadCount = 0;
  isDropdownOpen = false;
  notifications: any[] = [];
  currentUser: any = null;

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;

    // ignore clicks inside dropdown or bell
    if (target.closest('.notification-wrapper')) {
      return;
    }

    this.isDropdownOpen = false;
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.isDropdownOpen = false;
  }

  constructor(
    private socketService: AdminSocketService,
    private ordersStore: OrdersStore,
    private notificationStore: AdminNotificationStore,
    private notificationService: AdminNotificationService,
    private router: Router,
    public permissionService: PermissionService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.socketService.orderUpdate$.subscribe((payload: any) => {
      const order = payload?.data || payload;
      if (!order?._id) return;

      this.ordersStore.updateOrder(order);
    });

    this.notificationStore.notifications$.subscribe((list) => {
      this.notifications = list;
    });

    this.notificationStore.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isDropdownOpen = false;
      }
    });

    this.notificationService.fetchUnreadCount();
    this.notificationService.fetchAllNotifications();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id).subscribe(() => {
      this.notificationStore.markAsRead(id);
    });
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  goToNotifications(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = false;
    this.router.navigate(['/admin/notifications']);
  }

  openNotification(notification: any) {
    if (!notification.isRead) {
      this.markAsRead(notification._id);
    }

    this.isDropdownOpen = false;

    if (notification.ticketId && this.permissionService.has('support.read')) {
      this.router.navigate(['/admin/support'], {
        queryParams: { ticketId: notification.ticketId },
      });
      return;
    }

    if (this.permissionService.has('notifications.read')) {
      this.router.navigate(['/admin/notifications']);
    }
  }
}
