import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: any;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'LOGISTICS_TOKEN';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken(),
  );
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private api: ApiService) {}

  // ------------------------
  // AUTH APIs
  // ------------------------

  login(payload: { email: string; password: string }) {
    return this.api.post<LoginResponse>('/auth/login', payload).pipe(
      tap((res) => {
        if (res?.data?.token) {
          this.setToken(res.data.token);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  register(payload: any) {
    return this.api.post('/auth/register', payload);
  }

  sendOtp(payload: { phone: string }) {
    return this.api.post('/auth/send-otp', payload);
  }

  verifyOtp(payload: { phone: string; otp: string }) {
    return this.api.post('/auth/verify-otp', payload);
  }

  // ------------------------
  // TOKEN MANAGEMENT
  // ------------------------

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem('LOGISTICS_TOKEN');
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  logout() {
    this.removeToken();
  }
}
