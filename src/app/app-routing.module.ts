import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './modules/public-layout/pages/public-layout/public-layout.component';
import { LandingGuard } from './core/guards/landing.guard';
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
    path: '',
    component: PublicLayoutComponent,
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
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
