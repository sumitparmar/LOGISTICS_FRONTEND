import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  menuOpen = false;
  currentUrl: string = '';
  userName: string = '';
  userInitial: string = '';
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;

      if (status) {
        this.loadUser();
      } else {
        this.userName = '';
        this.userInitial = '';
      }
    });

    this.currentUrl = this.router.url;

    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
  }

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  loadUser() {
    const user = this.authService.getUser();
    // if (user && user.name) {
    //   this.userName = user.name;
    //   this.userInitial = user.name.charAt(0).toUpperCase();
    // }

    if (user) {
      this.userName = user.name || '';
      this.userInitial = user.name?.charAt(0)?.toUpperCase() || '';

      this.isAdmin = user.role?.toLowerCase() === 'admin';
    }
  }

  clearUser() {
    this.userName = '';
    this.userInitial = '';
  }

  openMenu() {
    this.menuOpen = true;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  goToProfile() {
    this.router.navigate(['/app/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToLogin() {
    if (this.router.url !== '/auth/login') {
      this.router.navigate(['/auth/login']);
    }
  }

  openAdminPanel() {
    window.open('/admin', '_blank');
  }
}
