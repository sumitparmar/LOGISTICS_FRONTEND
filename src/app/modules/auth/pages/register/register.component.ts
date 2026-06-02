import { Component, OnInit } from '@angular/core';
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

  submit() {
    if (this.registerForm.invalid) {
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

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage =
          'Account created. Please verify your email before logging in.';

        setTimeout(() => this.router.navigate(['/auth/login']), 1800);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Registration failed';
      },
    });
  }
}
