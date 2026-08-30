import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationStateService } from 'src/app/shared/services/notification-state.service';
@Component({
  selector: 'app-customer-topbar',
  templateUrl: './customer-topbar.component.html',
  styleUrls: ['./customer-topbar.component.css'],
})
export class CustomerTopbarComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  userName = '';
  userInitial = '';
  isDropdownOpen = false;
  isAdmin = false;
  private destroy$ = new Subject<void>();

  @HostListener('document:click')
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationState: NotificationStateService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (user) {
      this.userName = user.name || '';
      this.userInitial = user.name?.charAt(0)?.toUpperCase() || 'U';

      this.isAdmin = user.role?.toLowerCase() === 'admin';
    }

    this.notificationState.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
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
    this.notificationState.refresh().subscribe();
  }

  goNotifications(): void {
    this.router.navigate(['/app/notifications']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // openAdminPanel(): void {
  //   this.router.navigate(['/admin']);
  // }

  openAdminPanel(): void {
    const adminUrl = `${window.location.origin}/admin`;

    window.open(adminUrl, '_blank', 'noopener,noreferrer');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
