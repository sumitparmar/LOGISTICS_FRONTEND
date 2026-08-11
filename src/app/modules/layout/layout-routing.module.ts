import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShellComponent } from './pages/shell/shell.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(
            (m) => m.DashboardModule,
          ),
      },

      {
        path: 'create-order',
        redirectTo: 'delivery/create',
        pathMatch: 'full',
      },

      {
        path: 'orders',
        loadChildren: () =>
          import('../orders/orders.module').then((m) => m.OrdersModule),
      },

      {
        path: 'track',
        loadChildren: () =>
          import('../track/track.module').then((m) => m.TrackModule),
      },

      // TEMP WALLET DISABLED:
      // Keep direct wallet URLs safe while the user wallet feature is paused.
      {
        path: 'wallet',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      // Keep the wallet module source intact for later use. Replace the
      // redirect above with this lazy route when wallet is ready again.
      // {
      //   path: 'wallet',
      //   loadChildren: () =>
      //     import('../wallet/wallet.module').then((m) => m.WalletModule),
      // },

      {
        path: 'support',
        loadChildren: () =>
          import('../support/support.module').then((m) => m.SupportModule),
      },

      {
        path: 'driver-onboarding',
        loadChildren: () =>
          import('../driver-onboarding/driver-onboarding.module').then(
            (m) => m.DriverOnboardingModule,
          ),
      },

      {
        path: 'delivery',
        loadChildren: () =>
          import('../delivery/delivery.module').then((m) => m.DeliveryModule),
      },

      {
        path: 'profile',
        loadChildren: () =>
          import('../profile/profile.module').then((m) => m.ProfileModule),
      },

      {
        path: 'settings',
        loadChildren: () =>
          import('../settings/settings.module').then((m) => m.SettingsModule),
      },

      {
        path: 'notifications',
        loadChildren: () =>
          import('../notifications/notifications.module').then(
            (m) => m.NotificationsModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
