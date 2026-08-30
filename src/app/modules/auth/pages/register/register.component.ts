import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

function passwordMatchValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  hasPendingBooking = false;
  readonly heroImage = 'assets/images/movekart-register-hero.png';
  readonly heroMetrics = [
    { value: '3 min', label: 'average signup' },
    { value: '24/7', label: 'booking access' },
    { value: 'Live', label: 'order visibility' },
  ];
  readonly trustPoints = [
    'Verified business onboarding',
    'Saved delivery quotes',
    'Secure customer workspace',
  ];
  readonly onboardingSteps = [
    {
      step: '01',
      title: 'Create account',
      text: 'Add your business or personal delivery details once.',
    },
    {
      step: '02',
      title: 'Confirm access',
      text: 'Verify your email and keep every booking tied to one profile.',
    },
    {
      step: '03',
      title: 'Book faster',
      text: 'Resume saved quotes, create deliveries, and track every order.',
    },
  ];
  readonly formHighlights = [
    'Encrypted account access',
    'Phone-ready delivery alerts',
    'Dashboard enabled after login',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.hasPendingBooking = !!localStorage.getItem('PENDING_DELIVERY');

    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );
  }

  get f() {
    return this.registerForm.controls;
  }

  submit(): void {
    if (this.loading || this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.f['name'].value,
      email: this.f['email'].value,
      phone: this.f['phone'].value,
      password: this.f['password'].value,
    };

    this.authService
      .register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMessage =
            'Account created. Please verify your email before logging in.';

          setTimeout(() => {
            if (this.router.url !== '/auth/login') {
              this.router.navigate(['/auth/login']);
            }
          }, 1800);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Registration failed';
        },
      });
  }
}
