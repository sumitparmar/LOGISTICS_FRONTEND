import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-customer-sidebar',
  templateUrl: './customer-sidebar.component.html',
  styleUrls: ['./customer-sidebar.component.css'],
})
export class CustomerSidebarComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  menuItems: SidebarItem[] = [
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
