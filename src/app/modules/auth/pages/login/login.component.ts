import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
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
  readonly heroImage = 'assets/images/movekart-login-hero.png';
  readonly trustPoints = [
    'Role-aware dashboard access',
    'OTP fallback for personal bookings',
    'Saved quote recovery',
  ];
  readonly accessMetrics = [
    { value: '2 ways', label: 'to sign in' },
    { value: 'Live', label: 'delivery state' },
    { value: 'Secure', label: 'session control' },
  ];
  readonly workflowCards = [
    {
      title: 'Business operations',
      text: 'Manage orders, dashboards, and team delivery activity after login.',
    },
    {
      title: 'Personal delivery',
      text: 'Continue a saved quote with phone OTP when password access is not needed.',
    },
    {
      title: 'Smart redirect',
      text: 'MoveKart returns you to the dashboard or pending booking automatically.',
    },
  ];
  readonly securityNotes = [
    'Token stored through AuthService',
    'Onboarding prompt preserved',
    'Pending delivery state restored',
  ];
  businessForm!: FormGroup;
  phoneForm!: FormGroup;
  otpForm!: FormGroup;

  phoneNumber = '';
  loading = false;
  errorMessage = '';
  mockOtp = '';
  private returnUrl = '/app/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/app/dashboard';
    // Business login form
    this.hasPendingBooking = !!localStorage.getItem('PENDING_DELIVERY');
    this.businessForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // Phone form
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
    });

    // OTP form
    this.otpForm = this.fb.group({
      otp: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
    });
  }

  switchMode(mode: LoginMode): void {
    this.loginMode = mode;

    this.errorMessage = '';
    this.mockOtp = '';
    this.loading = false;

    this.otpStep = 'PHONE';

    this.businessForm.reset();
    this.phoneForm.reset();
    this.otpForm.reset();
  }

  submitBusiness(): void {
    if (this.loading || this.businessForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService
      .login(this.businessForm.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          // Store token
          if (res?.data?.token) {
            this.authService.setToken(res.data.token);
          }

          // Store user for role-based routing
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

            let pendingState = null;

            try {
              pendingState = JSON.parse(pending);
            } catch {
              pendingState = null;
            }

            this.router.navigate(['/app/delivery/create'], {
              state: pendingState,
            });
          } else {
            this.router.navigateByUrl(this.returnUrl);
          }
        },

        error: (err) => {
          this.errorMessage = err?.error?.message || 'Login failed';
        },
      });
  }

  sendOtp(): void {
    if (this.loading || this.phoneForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.phoneNumber = this.phoneForm.value.phone;

    const fallbackEmail = this.phoneForm.value.email?.trim();

    this.authService
      .sendOtp({
        phone: this.phoneNumber,
        ...(fallbackEmail && { email: fallbackEmail }),
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          this.mockOtp = res?.data?.mockOtp || '';
          this.otpStep = 'OTP';
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to send OTP';
        },
      });
  }

  verifyOtp(): void {
    if (this.loading || this.otpForm.invalid) return;
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

            let pendingState = null;

            try {
              pendingState = JSON.parse(pending);
            } catch {
              pendingState = null;
            }

            this.router.navigate(['/app/delivery/create'], {
              state: pendingState,
            });
          } else {
            this.router.navigateByUrl(this.returnUrl);
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Invalid OTP';
        },
      });
  }
}
