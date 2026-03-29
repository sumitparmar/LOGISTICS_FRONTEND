import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { AdminUsersService } from '../../services/admin-users.service';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
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
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.loadUsers();
    this.setupSearchStream();
  }

  setupSearchStream(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((search) => {
          this.search = search;
          this.page = 1;
          return this.adminUsersService.getUsers(
            this.page,
            this.limit,
            this.search,
          );
        }),
      )
      .subscribe({
        next: (res) => {
          this.users = res.data.map((u: any) => ({
            ...u,
            id: u._id || u.id,
          }));
          this.totalPages = res.pagination?.totalPages || 1;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Search API failed:', err);
        },
      });
  }

  loadUsers() {
    this.adminUsersService
      .getUsers(this.page, this.limit, this.search)
      .subscribe({
        next: (res) => {
          this.users = res.data.map((u: any) => ({
            ...u,
            id: u._id || u.id, // keep for routing
          }));
          this.totalPages = res.pagination?.totalPages || 1;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load users', err);
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
    this.users = this.users.filter((u) => u !== this.selectedUser);

    this.showConfirm = false;
    this.selectedUser = null;
  }

  onCancelDelete(): void {
    this.showConfirm = false;
    this.selectedUser = null;
  }

  goToCreate(): void {
    this.router.navigate(['/admin/users/create']);
  }
}
