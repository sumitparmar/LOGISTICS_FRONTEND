import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
type LoginMode = 'BUSINESS' | 'INDIVIDUAL';
type OtpStep = 'PHONE' | 'OTP';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginMode: LoginMode = 'BUSINESS';
  otpStep: OtpStep = 'PHONE';
  hasPendingBooking = false;
  businessForm!: FormGroup;
  phoneForm!: FormGroup;
  otpForm!: FormGroup;

  phoneNumber = '';
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Business login form
    this.hasPendingBooking = !!localStorage.getItem('PENDING_DELIVERY');
    this.businessForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // Phone form
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });

    // OTP form
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  switchMode(mode: LoginMode) {
    this.loginMode = mode;

    this.errorMessage = '';
    this.loading = false;

    this.otpStep = 'PHONE';

    this.businessForm.reset();
    this.phoneForm.reset();
    this.otpForm.reset();
  }

  submitBusiness() {
    if (this.businessForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .login(this.businessForm.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          // ✅ STORE TOKEN
          if (res?.data?.token) {
            this.authService.setToken(res.data.token);
          }

          // ✅ STORE USER (CRITICAL FOR ROLE)
          if (res?.data?.user) {
            this.authService.setUser(res.data.user);
            this.authService.setDeliveryMode(
              res.data.user?.deliveryMode || null,
            );
          } else {
            // fallback (if backend didn't send user)
            this.authService.getProfile().subscribe((user: any) => {
              this.authService.setUser(user.data);
              this.authService.setDeliveryMode(user.data?.deliveryMode || null);
            });
          }

          sessionStorage.setItem('show_onboarding', 'true');

          const pending = localStorage.getItem('PENDING_DELIVERY');

          if (pending) {
            localStorage.removeItem('PENDING_DELIVERY');

            this.router.navigate(['/app/create-order'], {
              state: JSON.parse(pending),
            });
          } else {
            this.router.navigate(['/app/dashboard']);
          }
        },

        error: (err) => {
          this.errorMessage = err?.error?.message || 'Login failed';
        },
      });
  }

  sendOtp() {
    if (this.phoneForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.phoneNumber = this.phoneForm.value.phone;

    this.authService
      .sendOtp({ phone: this.phoneNumber })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.otpStep = 'OTP';
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to send OTP';
        },
      });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .verifyOtp({
        phone: this.phoneNumber,
        otp: this.otpForm.value.otp,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          if (!res?.data?.token) {
            this.errorMessage = 'Authentication failed';
            return;
          }

          this.authService.setToken(res.data.token);

          if (res?.data?.user) {
            this.authService.setUser(res.data.user);
            this.authService.setDeliveryMode(
              res.data.user?.deliveryMode || null,
            );
          } else {
            // fallback: fetch profile
            this.authService.getProfile().subscribe((user: any) => {
              this.authService.setUser(user.data);
              this.authService.setDeliveryMode(user.data?.deliveryMode || null);
            });
          }

          sessionStorage.setItem('show_onboarding', 'true');
          const pending = localStorage.getItem('PENDING_DELIVERY');

          if (pending) {
            localStorage.removeItem('PENDING_DELIVERY');

            this.router.navigate(['/app/create-order'], {
              state: JSON.parse(pending),
            });
          } else {
            this.router.navigate(['/app/dashboard']);
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Invalid OTP';
        },
      });
  }
}
