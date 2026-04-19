import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  title = 'Logistics_FrontEnd';
  isAdminRoute = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private analytics: AnalyticsService,
    private authService: AuthService,
  ) {
    this.trackRouteChanges();
    this.bootstrapSession();
  }

  private bootstrapSession(): void {
    if (this.authService.getToken()) {
      this.authService.refreshProfileState();
    }
  }

  private trackRouteChanges(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        this.isAdminRoute = url.startsWith('/admin');

        try {
          this.analytics.trackPageView(url);
        } catch (error) {}
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
