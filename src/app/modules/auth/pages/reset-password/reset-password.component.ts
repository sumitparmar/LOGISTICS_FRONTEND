import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators'; // ✅ IMPORTANT

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'Invalid or expired reset link';
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

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;

    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.form.invalid || !this.token) {
      this.errorMessage = 'Invalid request';
      this.successMessage = '';
      return;
    }

    this.loading = true; // ✅ START LOADING

    this.authService
      .resetPassword({
        token: this.token,
        password: this.form.value.password,
      })
      .pipe(finalize(() => (this.loading = false))) // ✅ AUTO RESET
      .subscribe({
        next: () => {
          this.successMessage = 'Password reset successful';
          this.errorMessage = '';
          this.form.reset();

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (err: any) => {
          if (err?.error?.message?.toLowerCase().includes('expired')) {
            this.errorMessage = 'Reset link expired. Please request again.';
          } else {
            this.errorMessage = err?.error?.message || 'Reset failed';
          }

          this.successMessage = '';
        },
      });
  }
}
