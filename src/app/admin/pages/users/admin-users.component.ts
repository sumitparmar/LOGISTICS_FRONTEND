import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { AdminUsersService } from '../../services/admin-users.service';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { AdminUsersStore } from '../../services/admin-users.store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  private sub!: Subscription;
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
  totalPages = 1;
  search = '';
  columns: any[] = [];
  showConfirm = false;
  selectedUser: any = null;
  roles: any[] = [];

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
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.loadUsers();
    this.setupSearchStream();
    this.loadRoles();
    this.sub = new Subscription();

    // USERS
    this.sub.add(
      this.usersStore.users$.subscribe((users) => {
        this.users = users.map((u: any) => ({
          ...u,
          _id: u._id || u.id,
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
      }),
    );
  }

  setupSearchStream(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((search) => {
          this.search = search;
          this.page = 1;

          this.usersStore.loadUsers(
            this.page,
            this.limit,
            this.search,
            this.filterStatus,
          );
          return [];
        }),
      )
      .subscribe();
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
    this.adminUsersService.getRoles().subscribe({
      next: (res: any) => {
        this.roles = res.data || [];
      },
      error: (err: any) => {
        console.error('Failed to load roles', err);
      },
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadUsers();
  }

  onSearchChange(search: string) {
    this.searchSubject.next(search);
  }

  onEdit(user: any): void {
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
    console.log('USER OBJECT:', user);
    console.log('USER ID SENT:', userId);
    const request$ = roleId
      ? this.adminUsersService.assignRole({
          userId,
          roleId,
        })
      : this.adminUsersService.removeRole(userId);

    request$.subscribe({
      next: () => {
        // Update UI instantly (no reload)
        user.adminRole = roleId
          ? this.roles.find((r) => r._id === roleId)
          : null;
      },
      error: (err: any) => {
        console.error('Role update failed', err);
      },
    });
  }

  getRoleId(user: any): string | null {
    return user?.adminRole?._id || null;
  }

  onToggleStatus(user: any): void {
    this.selectedUser = user;
    this.showConfirm = true;
  }

  onFilterChange(value: string) {
    this.filterStatus = value;
    this.page = 1;
    this.loadUsers();
  }

  onConfirmDelete(): void {
    const user = this.selectedUser;

    if (!user) return;

    const id = user.id || user._id;
    const newStatus = !user.isActive;

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
        },
        error: (err) => {
          console.error('Status update failed', err);
        },
      });
  }

  onCancelDelete(): void {
    this.showConfirm = false;
    this.selectedUser = null;
  }

  goToCreate(): void {
    this.router.navigate(['/admin/users/create']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
