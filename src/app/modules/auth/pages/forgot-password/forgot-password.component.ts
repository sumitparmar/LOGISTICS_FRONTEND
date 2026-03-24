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

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';
    this.message = '';

    this.authService
      .forgotPassword({ email: this.form.value.email! })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.message = 'Reset link sent to your email';
        },
        error: (err) => {
          this.error = err?.error?.message || 'Something went wrong';
        },
      });
  }
}
