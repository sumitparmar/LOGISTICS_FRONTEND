import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AdminUsersService } from './admin-users.service';
import { AdminSocketService } from './admin-socket.service';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersStore {
  private usersSubject = new BehaviorSubject<any[]>([]);
  users$ = this.usersSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();
  private lastPage = 1;
  private lastLimit = 5;
  private lastSearch = '';
  private lastStatus = '';

  private paginationSubject = new BehaviorSubject<any>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });

  pagination$ = this.paginationSubject.asObservable();

  constructor(
    private usersService: AdminUsersService,
    private socketService: AdminSocketService,
  ) {
    this.socketService.userUpdate$.subscribe(() => {
      this.loadUsers(
        this.lastPage,
        this.lastLimit,
        this.lastSearch,
        this.lastStatus,
      );
    });
  }

  loadUsers(page: number, limit: number, search: string, status?: string) {
    // store state FIRST
    this.lastPage = page;
    this.lastLimit = limit;
    this.lastSearch = search;
    this.lastStatus = status || '';
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.usersService.getUsers(page, limit, search, status).subscribe({
      next: (res) => {
        const users = (res?.data || []).map((u: any) => ({
          ...u,
          id: u._id || u.id,
        }));

        this.usersSubject.next(users);

        //  backend pagination
        this.paginationSubject.next(res?.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 1,
        });
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error('Store load users failed', err);
        this.loadingSubject.next(false);
        this.errorSubject.next(
          err?.error?.message || 'Unable to load users right now.',
        );
      },
    });
  }

  removeUser(id: string) {
    const current = this.usersSubject.value;
    this.usersSubject.next(current.filter((u) => u.id !== id));
  }
}
