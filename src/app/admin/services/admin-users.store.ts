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

  constructor(
    private usersService: AdminUsersService,
    private socketService: AdminSocketService,
  ) {
    this.socketService.userUpdate$.subscribe(() => {
      console.log('🔥 STORE AUTO REFRESH');
      this.loadUsers(1, 5, ''); // safe default
    });
  }
  loadUsers(page: number, limit: number, search: string) {
    this.usersService.getUsers(page, limit, search).subscribe({
      next: (res) => {
        const users = res.data.map((u: any) => ({
          ...u,
          id: u._id || u.id,
        }));

        this.usersSubject.next(users);
      },
      error: (err) => {
        console.error('Store load users failed', err);
      },
    });
  }

  removeUser(id: string) {
    const current = this.usersSubject.value;
    this.usersSubject.next(current.filter((u) => u.id !== id));
  }
}
