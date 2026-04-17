import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  currentUrl: string = '';
  userName: string = '';
  userInitial: string = '';
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isMenuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url;

    this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;

      if (status) {
        this.loadUser();
      } else {
        this.resetUser();
      }
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl = this.router.url;
        this.isMenuOpen = false;
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  loadUser(): void {
    const user = this.authService.getUser();

    if (user) {
      this.userName = user.name || '';
      this.userInitial = user.name?.charAt(0)?.toUpperCase() || '';
      this.isAdmin = user.role?.toLowerCase() === 'admin';
    }
  }

  resetUser(): void {
    this.userName = '';
    this.userInitial = '';
    this.isAdmin = false;
  }

  goToProfile(): void {
    this.closeMenu();
    this.router.navigate(['/app/profile']);
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToLogin(): void {
    this.closeMenu();

    if (this.router.url !== '/auth/login') {
      this.router.navigate(['/auth/login']);
    }
  }

  openAdminPanel(): void {
    window.open('/admin', '_blank');
  }
}
