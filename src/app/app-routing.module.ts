import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Landing Website
  {
    path: '',
    loadChildren: () =>
      import('./modules/landing/landing.module').then((m) => m.LandingModule),
  },

  // Authentication
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },

  // After login layout (dashboard shell)
  {
    path: 'app',
    loadChildren: () =>
      import('./modules/layout/layout.module').then((m) => m.LayoutModule),
  },
  {
    path: 'track',
    loadChildren: () =>
      import('./modules/track/track.module').then((m) => m.TrackModule),
  },
  // Fallback
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
