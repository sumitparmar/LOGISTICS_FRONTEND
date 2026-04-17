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
  globalSearch = '';
  isUserMenuOpen = false;
  isOnline = false;

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;

    if (target.closest('.notification-wrapper')) {
      return;
    }

    if (target.closest('.admin-user')) {
      return;
    }

    if (target.closest('.user-dropdown')) {
      return;
    }

    this.isDropdownOpen = false;
    this.isUserMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.isDropdownOpen = false;
    this.isUserMenuOpen = false;
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
    this.isOnline = !!this.currentUser;
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

  runGlobalSearch(): void {
    const term = this.globalSearch.trim();

    if (!term) return;

    const isNumeric = /^[0-9]+$/.test(term);
    const isEmail = term.includes('@');

    if (isNumeric || term.length >= 3) {
      this.router.navigate(['/admin/orders'], {
        queryParams: { search: term },
      });
      return;
    }

    if (isEmail) {
      this.router.navigate(['/admin/users'], {
        queryParams: { search: term },
      });
      return;
    }

    this.router.navigate(['/admin/orders'], {
      queryParams: { search: term },
    });
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  goDashboard(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/admin']);
  }

  goSettings(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/admin/settings']);
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
