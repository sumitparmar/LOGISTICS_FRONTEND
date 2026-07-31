import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  loading = false;
  message = '';
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {}

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.error = '';
    this.message = '';
    this.authService
      .forgotPassword({
        email: this.form.value.email!.trim(),
      })

      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.message = 'Reset link sent to your email';
          this.form.disable();
        },
        error: (err) => {
          this.error =
            err?.error?.message ||
            'Unable to process password reset request. Please try again.';
        },
      });
  }
}
