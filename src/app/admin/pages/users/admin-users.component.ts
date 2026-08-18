import { Component, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { AdminUsersService } from '../../services/admin-users.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { AdminUsersStore } from '../../services/admin-users.store';
import { ToastService } from '../../services/toast.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private sub = new Subscription();
  private searchSubject = new Subject<string>();
  @ViewChild('statusTemplate', { static: true })
  statusTemplate!: TemplateRef<any>;

  @ViewChild('actionsTemplate', { static: true })
  actionsTemplate!: TemplateRef<any>;

  @ViewChild('nameTemplate', { static: true })
  nameTemplate!: TemplateRef<any>;

  @ViewChild('roleTemplate', { static: true })
  roleTemplate!: TemplateRef<any>;

  filterStatus: string = '';
  users: any[] = [];
  page = 1;
  limit = 5;
  total = 0;
  totalPages = 1;
  search = '';
  columns: any[] = [];
  showConfirm = false;
  selectedUser: any = null;
  roles: any[] = [];
  loading = false;
  errorMessage: string | null = null;
  rolesLoading = false;
  rolesError = '';
  roleUpdatingIds = new Set<string>();
  statusUpdating = false;

  initializeColumns(): void {
    this.columns = [
      {
        key: 'name',
        label: 'Name',
        template: this.nameTemplate,
      },
      { key: 'email', label: 'Email' },

      {
        key: 'role',
        label: 'Role',
        template: this.roleTemplate,
      },

      {
        key: 'isActive',
        label: 'Status',
        template: this.statusTemplate,
      },

      {
        key: 'actions',
        label: '',
        template: this.actionsTemplate,
      },
    ];
  }

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private usersStore: AdminUsersStore,
    private toastService: ToastService,
    private route: ActivatedRoute,
    public permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.setupSearchStream();
    this.loadRoles();

    // USERS
    this.sub.add(
      this.usersStore.users$.subscribe((users) => {
        this.users = users.map((u: any) => ({
          ...u,
          _id: u._id || u.id,
          adminRoleId: u.adminRole?._id || null,
        }));

        this.cdr.detectChanges();
      }),
    );

    //  PAGINATION
    this.sub.add(
      this.usersStore.pagination$.subscribe((p) => {
        if (!p) return;

        this.totalPages = p.totalPages;
        this.page = p.page;
        this.total = p.total || 0;
      }),
    );

    this.sub.add(
      this.usersStore.loading$.subscribe((loading) => {
        this.loading = loading;
      }),
    );

    this.sub.add(
      this.usersStore.error$.subscribe((error) => {
        this.errorMessage = error;
      }),
    );

    this.sub.add(
      this.route.queryParams.subscribe((params) => {
        const requestedStatus = params['status'] || '';
        const allowedStatuses = new Set(['', 'active', 'inactive']);
        this.search = params['search'] || '';
        this.filterStatus = allowedStatuses.has(requestedStatus)
          ? requestedStatus
          : '';
        this.page = 1;
        this.loadUsers();
      }),
    );
  }

  setupSearchStream(): void {
    this.sub.add(
      this.searchSubject
        .pipe(debounceTime(400), distinctUntilChanged())
        .subscribe((search) => {
          this.search = search;
          this.page = 1;
          this.errorMessage = null;

          this.usersStore.loadUsers(
            this.page,
            this.limit,
            this.search,
            this.filterStatus,
          );
        }),
    );
  }

  loadUsers() {
    this.usersStore.loadUsers(
      this.page,
      this.limit,
      this.search,
      this.filterStatus,
    );
  }

  loadRoles(): void {
    this.rolesLoading = true;
    this.rolesError = '';
    this.adminUsersService.getRoles().subscribe({
      next: (res: any) => {
        this.roles = res?.data || [];
        this.rolesLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load roles', err);
        this.rolesLoading = false;
        this.rolesError = 'Unable to load admin roles.';
      },
    });
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || this.loading) return;
    this.page = page;
    this.loadUsers();
  }

  onLimitChange(limit: number) {
    if (limit === this.limit || this.loading) return;

    this.limit = limit;
    this.page = 1;
    this.loadUsers();
  }

  onSearchChange(search: string) {
    this.searchSubject.next(search);
  }

  onEdit(user: any): void {
    if (!this.permissionService.has('users.update')) return;
    const id = user._id || user.id;

    if (!id) {
      console.error('User ID missing');
      return;
    }

    this.router.navigate(['/admin/users/edit', id]);
  }

  onRoleChange(user: any, roleId: string | null): void {
    const userId =
      typeof user._id === 'string' ? user._id : user._id?._id || user.id;

    if (!userId || this.roleUpdatingIds.has(userId)) return;

    this.roleUpdatingIds.add(userId);
    const request$ = roleId
      ? this.adminUsersService.assignRole({ userId, roleId })
      : this.adminUsersService.removeRole(userId);

    request$.subscribe({
      next: () => {
        // ✅ Always sync from backend (single source of truth)
        this.roleUpdatingIds.delete(userId);
        this.toastService.success('Admin role updated successfully');
        this.loadUsers();
      },

      error: (err: any) => {
        console.error('Role update failed', err);

        // ✅ Reload to revert UI properly
        this.roleUpdatingIds.delete(userId);
        this.loadUsers();

        this.toastService.error(err?.error?.message || 'Role update failed');
      },
    });
  }

  trackByUser(index: number, user: any) {
    return user._id || user.id;
  }

  // getRoleId(user: any): string | null {
  //   return user?.adminRole?._id || null;
  // }

  onToggleStatus(user: any): void {
    if (!this.permissionService.has('users.update') || this.statusUpdating) return;
    this.selectedUser = user;
    this.showConfirm = true;
  }

  onFilterChange(value: string) {
    if (!['', 'active', 'inactive'].includes(value)) return;
    this.filterStatus = value;
    this.page = 1;
    this.errorMessage = null;
    this.loadUsers();
  }

  onConfirmDelete(): void {
    const user = this.selectedUser;

    if (!user) return;

    const id = user.id || user._id;
    const newStatus = !user.isActive;
    this.statusUpdating = true;

    this.adminUsersService
      .updateUser(id, {
        isActive: newStatus,
      })
      .subscribe({
        next: () => {
          // instant UI (optional but good UX)
          // this.usersStore.removeUser(id);

          // re-fetch from backend (source of truth)
          this.loadUsers();

          this.showConfirm = false;
          this.selectedUser = null;
          this.statusUpdating = false;
          this.toastService.success(
            newStatus ? 'User activated successfully' : 'User deactivated successfully',
          );
        },
        error: (err) => {
          console.error('Status update failed', err);
          this.statusUpdating = false;
          this.toastService.error(err?.error?.message || 'Status update failed');
        },
      });
  }

  onCancelDelete(): void {
    this.showConfirm = false;
    this.selectedUser = null;
  }

  goToCreate(): void {
    if (!this.permissionService.has('users.create')) return;
    this.router.navigate(['/admin/users/create']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.searchSubject.complete();
  }
}
