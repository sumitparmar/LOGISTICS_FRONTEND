import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LandingGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    if (this.auth.hasToken()) {
      // 🔥 already logged in → skip landing
      this.router.navigate(['/app/dashboard']);
      return false;
    }

    return true;
  }
}
