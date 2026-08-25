import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './modules/public-layout/pages/public-layout/public-layout.component';
import { LandingGuard } from './core/guards/landing.guard';
import { MaintenanceGuard } from './core/guards/maintenance.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },

  {
    path: 'app',
    loadChildren: () =>
      import('./modules/layout/layout.module').then((m) => m.LayoutModule),
  },

  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
  },

  {
    path: 'maintenance',
    loadChildren: () =>
      import('./modules/maintenance/maintenance.module').then(
        (m) => m.MaintenanceModule,
      ),
  },

  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [MaintenanceGuard],
    children: [
      {
        path: '',
        canActivate: [LandingGuard],
        loadChildren: () =>
          import('./modules/landing/landing.module').then(
            (m) => m.LandingModule,
          ),
        pathMatch: 'full',
      },

      {
        path: 'become-courier/apply',
        loadChildren: () =>
          import('./modules/driver-onboarding/driver-onboarding.module').then(
            (m) => m.DriverOnboardingModule,
          ),
      },

      {
        path: 'become-courier',
        loadChildren: () =>
          import('./modules/courier/courier.module').then(
            (m) => m.CourierModule,
          ),
      },

      {
        path: 'refund-policy',
        loadChildren: () =>
          import('./modules/refund-policy/refund-policy.module').then(
            (m) => m.RefundPolicyModule,
          ),
      },

      {
        path: 'community-guidelines',
        loadChildren: () =>
          import('./modules/community-guidelines/community-guidelines.module').then(
            (m) => m.CommunityGuidelinesModule,
          ),
      },

      {
        path: 'zero-tolerance-policy',
        loadChildren: () =>
          import('./modules/zero-tolerance/zero-tolerance.module').then(
            (m) => m.ZeroToleranceModule,
          ),
      },

      {
        path: 'privacy-policy',
        loadChildren: () =>
          import('./modules/privacy-policy/privacy-policy.module').then(
            (m) => m.PrivacyPolicyModule,
          ),
      },

      {
        path: 'track',
        loadChildren: () =>
          import('./modules/track/track.module').then((m) => m.TrackModule),
      },

      {
        path: 'pricing',
        loadChildren: () =>
          import('./modules/pricing/pricing.module').then(
            (m) => m.PricingModule,
          ),
      },

      {
        path: 'faq',
        loadChildren: () =>
          import('./modules/faq/faq.module').then((m) => m.FaqModule),
      },

      {
        path: 'city',
        loadChildren: () =>
          import('./modules/city/city.module').then((m) => m.CityModule),
      },

      {
        path: 'about',
        loadChildren: () =>
          import('./modules/about/about.module').then((m) => m.AboutModule),
      },

      {
        path: 'contact',
        loadChildren: () =>
          import('./modules/contact/contact.module').then(
            (m) => m.ContactModule,
          ),
      },

      {
        path: 'feedback',
        loadChildren: () =>
          import('./modules/feedback/feedback.module').then(
            (m) => m.FeedbackModule,
          ),
      },

      {
        path: 'blog',
        loadChildren: () =>
          import('./modules/blog/blog.module').then((m) => m.BlogModule),
      },

      {
        path: 'api-integration',
        loadChildren: () =>
          import('./modules/api-integration/api-integration.module').then(
            (m) => m.ApiIntegrationModule,
          ),
      },

      {
        path: 'terms-and-conditions',
        loadChildren: () =>
          import('./modules/terms/terms.module').then((m) => m.TermsModule),
      },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
