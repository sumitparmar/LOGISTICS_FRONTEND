import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Logistics_FrontEnd';

  // ✅ Admin route flag
  isAdminRoute = false;

  constructor(
    private router: Router,
    private analytics: AnalyticsService,
  ) {
    this.trackRouteChanges();
  }

  private trackRouteChanges(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        this.isAdminRoute = url.startsWith('/admin');

        this.analytics.trackPageView(url);

        this.analytics.trackEvent('visited_app', {
          page: url,
        });
      });
  }
}
