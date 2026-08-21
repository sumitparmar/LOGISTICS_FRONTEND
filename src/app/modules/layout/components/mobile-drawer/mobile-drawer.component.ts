import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

interface DrawerItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-mobile-drawer',
  templateUrl: './mobile-drawer.component.html',
  styleUrls: ['./mobile-drawer.component.css'],
})
export class MobileDrawerComponent {
  @Output() closed = new EventEmitter<void>();
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    const user = this.authService.getUser();
    this.isAdmin = user?.role?.toLowerCase() === 'admin';
  }

  menuItems: DrawerItem[] = [
    {
      label: 'Dashboard',
      icon: '🏠',
      route: '/app/dashboard',
    },
    {
      label: 'Create Delivery',
      icon: '🚚',
      route: '/app/delivery/create',
    },
    {
      label: 'My Orders',
      icon: '📦',
      route: '/app/orders',
    },
    {
      label: 'Track Orders',
      icon: '📍',
      route: '/app/track',
    },
    // TEMP WALLET DISABLED:
    // {
    //   label: 'Wallet',
    /*
      icon: '💳',
    */
    //   route: '/app/wallet',
    // },
    {
      label: 'Support Center',
      icon: '🎫',
      route: '/app/support',
    },
    {
      label: 'Driver Onboarding',
      icon: 'ID',
      route: '/app/driver-onboarding',
    },
    {
      label: 'Notifications',
      icon: '🔔',
      route: '/app/notifications',
    },
    {
      label: 'Profile',
      icon: '👤',
      route: '/app/profile',
    },
    {
      label: 'Settings',
      icon: '⚙️',
      route: '/app/settings',
    },
  ];

  closeDrawer(): void {
    this.closed.emit();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.closeDrawer();
  }

  openAdminPanel(): void {
    this.router.navigate(['/admin']);
    this.closeDrawer();
  }
}
