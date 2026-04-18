import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;

  token = '';
  loading = false;

  successMessage = '';
  errorMessage = '';

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'Invalid or expired reset link.';
      return;
    }

    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { mismatch: true };
  }

  get passwordControl() {
    return this.form.get('password');
  }

  get confirmPasswordControl() {
    return this.form.get('confirmPassword');
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.errorMessage = 'Please complete the form correctly.';
      this.successMessage = '';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService
      .resetPassword({
        token: this.token,
        password: this.passwordControl?.value,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMessage =
            'Password updated successfully. Redirecting to login...';

          this.form.reset();

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 1800);
        },
        error: (err) => {
          const message = err?.error?.message?.toLowerCase() || '';

          if (message.includes('expired')) {
            this.errorMessage =
              'This reset link has expired. Please request a new one.';
          } else if (message.includes('invalid')) {
            this.errorMessage =
              'Invalid reset token. Please request a new reset link.';
          } else {
            this.errorMessage =
              err?.error?.message || 'Unable to reset password.';
          }
        },
      });
  }
}
