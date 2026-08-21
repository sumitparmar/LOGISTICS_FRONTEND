import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { CustomerNotificationService } from 'src/app/modules/notifications/services/customer-notification.service';
import { NotificationStateService } from 'src/app/shared/services/notification-state.service';

@Component({
  selector: 'app-mobile-header',
  templateUrl: './mobile-header.component.html',
  styleUrls: ['./mobile-header.component.css'],
})
export class MobileHeaderComponent implements OnInit, OnDestroy {
  @Output() menuClicked = new EventEmitter<void>();
  isAdmin = false;
  userInitial = 'U';
  userName = '';
  unreadCount = 0;
  isDropdownOpen = false;
  private destroy$ = new Subject<void>();

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
    this.userName = user?.name || '';
    this.userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
    this.isAdmin = user?.role?.toLowerCase() === 'admin';

    this.loadUnreadCount();

    this.notificationState.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
      });

    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUnreadCount();
      });
  }

  openMenu(): void {
    this.menuClicked.emit();
  }

  openAdminPanel(): void {
    this.router.navigate(['/admin']);
  }

  openNotifications(): void {
    this.router.navigate(['/app/notifications']);
  }

  openProfile(): void {
    this.isDropdownOpen = false;
    this.router.navigate(['/app/profile']);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
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

  logout(): void {
    this.isDropdownOpen = false;
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
