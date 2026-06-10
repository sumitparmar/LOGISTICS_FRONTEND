import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationStateService {
  private unreadCountSubject = new BehaviorSubject<number>(0);

  unreadCount$ = this.unreadCountSubject.asObservable();

  setUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }
}
