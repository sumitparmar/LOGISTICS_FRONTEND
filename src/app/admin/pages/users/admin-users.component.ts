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

  users: any[] = [];
  page = 1;
  limit = 5;
  totalPages = 1;
  search = '';
  columns: any[] = [];
  showConfirm = false;
  selectedUser: any = null;

  // ngAfterViewInit(): void {
  //   this.initializeColumns();
  // }

  initializeColumns(): void {
    this.columns = [
      {
        key: 'name',
        label: 'Name',
        template: this.nameTemplate,
      },
      { key: 'email', label: 'Email' },

      { key: 'role', label: 'Role' },

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

    this.sub = this.usersStore.users$.subscribe((users) => {
      this.users = users;
      this.cdr.detectChanges();
    });
  }

  setupSearchStream(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((search) => {
          this.search = search;
          this.page = 1;

          this.usersStore.loadUsers(this.page, this.limit, this.search);

          return [];
        }),
      )
      .subscribe();
  }

  loadUsers() {
    this.usersStore.loadUsers(this.page, this.limit, this.search);
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadUsers();
  }

  onSearchChange(search: string) {
    this.searchSubject.next(search);
  }

  onEdit(user: any): void {
    if (!user?.id) {
      console.error('User ID missing');
      return;
    }

    this.router.navigate(['/admin/users/edit', user.id]);
  }

  onDelete(user: any): void {
    this.selectedUser = user;
    this.showConfirm = true;
  }

  onConfirmDelete(): void {
    const id = this.selectedUser?.id || this.selectedUser?._id;

    if (!id) {
      console.error('ID missing → STOP');
      return;
    }

    this.adminUsersService.deleteUser(id).subscribe({
      next: () => {
        // this.users = this.users.filter((u) => u.id !== id);
        this.usersStore.removeUser(id);
        this.loadUsers();

        this.showConfirm = false;
        this.selectedUser = null;
      },
      error: (err) => {
        console.error('STEP 2: API failed', err);
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
