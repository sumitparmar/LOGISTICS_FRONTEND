import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
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
  userPhoto = '';
  unreadCount = 0;
  isDropdownOpen = false;
  private destroy$ = new Subject<void>();

  @HostListener('document:click')
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  @HostListener('window:movekart:user-updated')
  handleUserUpdated(): void {
    this.loadUser();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationState: NotificationStateService,
  ) {}

  ngOnInit(): void {
    this.loadUser();

    this.notificationState.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
      });

  }

  private loadUser(): void {
    const user = this.authService.getUser();

    this.userName = user?.name || '';
    this.userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
    this.userPhoto = user?.profilePhoto || '';
    this.isAdmin = user?.role?.toLowerCase() === 'admin';
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
    this.notificationState.refresh().subscribe();
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
