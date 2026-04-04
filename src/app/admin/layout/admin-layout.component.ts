import { Component, OnInit } from '@angular/core';
import { AdminSocketService } from '../services/admin-socket.service';
import { OrdersStore } from '../services/admin-orders.store';
import { AdminNotificationStore } from '../services/admin-notification.store';
import { HostListener } from '@angular/core';
import { AdminNotificationService } from '../services/admin-notification.service';
import { Router, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  unreadCount = 0;
  isDropdownOpen = false;
  notifications: any[] = [];

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
  ) {}

  ngOnInit(): void {
    this.socketService.orderUpdate$.subscribe((payload: any) => {
      console.log(' LAYOUT RECEIVED:', payload);

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
}
