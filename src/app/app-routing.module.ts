import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './modules/public-layout/pages/public-layout/public-layout.component';

const routes: Routes = [
  // ===============================
  // AUTH ROUTES (NO HEADER)
  // ===============================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },

  // ===============================
  // AUTHENTICATED APP (DASHBOARD LAYOUT WITH HEADER)
  // ===============================
  {
    path: 'app',
    loadChildren: () =>
      import('./modules/layout/layout.module').then((m) => m.LayoutModule),
  },

  // ===============================
  // PUBLIC ROUTES (HEADER VISIBLE)
  // ===============================
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./modules/landing/landing.module').then(
            (m) => m.LandingModule,
          ),
        pathMatch: 'full',
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
    ],
  },

  // ===============================
  // FALLBACK
  // ===============================
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
