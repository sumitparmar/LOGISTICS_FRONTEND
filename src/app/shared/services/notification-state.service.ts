import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationStateService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private refreshRequest$?: Observable<number>;
  private lastRefreshAt = 0;
  private pollingSubscription?: Subscription;

  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  setUnreadCount(count: number): void {
    this.unreadCountSubject.next(Math.max(Number(count) || 0, 0));
  }

  increment(): void {
    this.setUnreadCount(this.unreadCountSubject.value + 1);
  }

  refresh(force = false): Observable<number> {
    const now = Date.now();
    if (!force && now - this.lastRefreshAt < 15000) {
      return of(this.unreadCountSubject.value);
    }

    if (this.refreshRequest$) return this.refreshRequest$;

    this.refreshRequest$ = this.http
      .get<{ count?: number }>(
        `${environment.apiBaseUrl}/customer-notifications/unread-count`,
      )
      .pipe(
        map((response) => Number(response?.count || 0)),
        tap((count) => {
          this.lastRefreshAt = Date.now();
          this.setUnreadCount(count);
        }),
        catchError(() => of(this.unreadCountSubject.value)),
        finalize(() => {
          this.refreshRequest$ = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

    return this.refreshRequest$;
  }

  startPolling(): void {
    if (this.pollingSubscription) return;

    this.refresh().subscribe();
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.refresh(true).subscribe();
    });
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }
}
