import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './modules/public-layout/pages/public-layout/public-layout.component';
import { LandingGuard } from './core/guards/landing.guard';
import { MaintenanceGuard } from './core/guards/maintenance.guard';

import { OrderDetailsComponent } from './features/admin/order-details/order-details.component';

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
    path: 'admin/orders/:id',
    component: OrderDetailsComponent,
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

      // ✅ ADDED HERE (CORRECT POSITION)
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
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
