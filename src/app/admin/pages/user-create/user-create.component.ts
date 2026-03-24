import { Component } from '@angular/core';
import { AdminUsersService } from '../../services/admin-users.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
})
export class AdminUserCreateComponent {
  submitting = false;

  constructor(
    private usersService: AdminUsersService,
    private router: Router,
    private toast: ToastService,
  ) {}

  handleSubmit(payload: any): void {
    if (this.submitting) return;

    this.submitting = true;

    this.usersService
      .createUser(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('User created successfully');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.toast.error('Failed to create user');
        },
      });
  }
}
