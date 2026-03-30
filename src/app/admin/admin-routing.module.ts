import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminOrdersComponent } from './pages/orders/admin-orders.component';
import { AdminUserEditComponent } from './pages/user-edit/user-edit.component';
import { AdminUserCreateComponent } from './pages/user-create/user-create.component';
import { AdminGuard } from '../core/guards/admin.guard';

import { DriversComponent } from './pages/drivers/drivers.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { SupportComponent } from './pages/support/support.component';
import { RolesComponent } from './pages/roles/roles.component';
import { SettingsComponent } from './pages/settings/settings.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        component: AdminDashboardComponent,
      },
      {
        path: 'users',
        component: AdminUsersComponent,
      },
      { path: 'orders', component: AdminOrdersComponent },

      {
        path: 'drivers',
        component: DriversComponent,
      },
      {
        path: 'payments',
        component: PaymentsComponent,
      },
      {
        path: 'pricing',
        component: PricingComponent,
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
      },
      {
        path: 'support',
        component: SupportComponent,
      },
      {
        path: 'roles',
        component: RolesComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },

      {
        path: 'users/edit/:id',
        component: AdminUserEditComponent,
      },

      {
        path: 'users/create',
        component: AdminUserCreateComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
