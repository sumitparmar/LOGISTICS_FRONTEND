import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
  private userKey = 'LOGISTICS_USER';
  private deliveryModeSubject = new BehaviorSubject<string | null>(
    this.getDeliveryMode(),
  );
  deliveryMode$ = this.deliveryModeSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken() && !!this.getUser(),
  );

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private apiBaseUrl = environment.apiBaseUrl;
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  // ------------------------
  // AUTH APIs
  // ------------------------

  login(payload: { email: string; password: string }) {
    return this.api.post<LoginResponse>('/auth/login', payload).pipe(
      tap((res) => {
        if (res?.data?.token) {
          this.setToken(res.data.token);
          this.setUser(res.data.user);
          this.deliveryModeSubject.next(res.data.user?.deliveryMode || null);
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
    return this.api.post<LoginResponse>('/auth/verify-otp', payload).pipe(
      tap((res) => {
        if (res?.data?.token) {
          this.setToken(res.data.token);
          this.setUser(res.data.user);

          // ✅ ADD THIS
          this.deliveryModeSubject.next(res.data.user?.deliveryMode || null);

          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  getUserRole(): string | null {
    return this.getUser()?.role || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // ------------------------
  // TOKEN MANAGEMENT
  // ------------------------

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    this.deliveryModeSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  logout() {
    this.removeToken();
  }

  // ------------------------
  // USER MANAGEMENT
  // ------------------------

  setUser(user: any) {
    if (!user) return;

    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem(this.userKey);

    if (!user || user === 'undefined' || user === 'null') {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch (e) {
      console.error('Invalid user in localStorage, clearing...');
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
  updateProfile(payload: any) {
    return this.api.put('/auth/profile', payload);
  }
  getDeliveryMode(): string | null {
    const user = this.getUser();
    return user?.deliveryMode || null;
  }
  setDeliveryMode(mode: string) {
    this.deliveryModeSubject.next(mode);
  }
  getProfile() {
    return this.api.get('/auth/me');
  }

  forgotPassword(data: { email: string }) {
    return this.http.post(`${this.apiBaseUrl}/auth/forgot-password`, data);
  }

  resetPassword(data: { token: string; password: string }) {
    return this.http.post(`${this.apiBaseUrl}/auth/reset-password`, data);
  }
}
