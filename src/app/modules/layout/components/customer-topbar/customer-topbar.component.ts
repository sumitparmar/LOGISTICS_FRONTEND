import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { HostListener } from '@angular/core';
import { interval } from 'rxjs';
import { NotificationStateService } from 'src/app/shared/services/notification-state.service';
import { CustomerNotificationService } from 'src/app/modules/notifications/services/customer-notification.service';
@Component({
  selector: 'app-customer-topbar',
  templateUrl: './customer-topbar.component.html',
  styleUrls: ['./customer-topbar.component.css'],
})
export class CustomerTopbarComponent implements OnInit {
  unreadCount = 0;
  userName = '';
  userInitial = '';
  isDropdownOpen = false;

  @HostListener('document:click')
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: CustomerNotificationService,
    private notificationState: NotificationStateService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (user) {
      this.userName = user.name || '';
      this.userInitial = user.name?.charAt(0)?.toUpperCase() || 'U';
    }

    this.loadUnreadCount();

    this.notificationState.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });

    interval(30000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  goProfile(): void {
    this.isDropdownOpen = false;
    this.router.navigate(['/app/profile']);
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => {
        this.notificationState.setUnreadCount(res.count || 0);
      },
      error: () => {
        this.unreadCount = 0;
      },
    });
  }

  goNotifications(): void {
    this.router.navigate(['/app/notifications']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
