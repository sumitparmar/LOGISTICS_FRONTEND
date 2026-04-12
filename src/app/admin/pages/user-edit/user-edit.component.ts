import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
})
export class AdminUserEditComponent implements OnInit {
  userId: string = '';
  userData: any = null;

  loading = false;
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private usersService: AdminUsersService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;

    this.usersService.getUserById(this.userId).subscribe({
      next: (res) => {
        //  Always create new reference
        this.userData = { ...res.data };

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load user', err);
        this.toast.error('Failed to load user');
        this.loading = false;
      },
    });
  }

  handleSubmit(payload: any): void {
    if (this.submitting) return;

    this.submitting = true;

    this.usersService
      .updateUser(this.userId, payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('User updated successfully');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.toast.error('Failed to update user');
        },
      });
  }
}
