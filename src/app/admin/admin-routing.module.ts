import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminOrdersComponent } from './pages/orders/admin-orders.component';
import { AdminUserEditComponent } from './pages/user-edit/user-edit.component';
import { AdminUserCreateComponent } from './pages/user-create/user-create.component';
import { AdminGuard } from '../core/guards/admin.guard';
import { PermissionGuard } from '../core/guards/permission.guard';

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
        canActivate: [PermissionGuard],
        data: { permission: 'users.read' },
      },

      {
        path: 'users/create',
        component: AdminUserCreateComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'users.create' },
      },

      {
        path: 'users/edit/:id',
        component: AdminUserEditComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'users.update' },
      },

      {
        path: 'orders',
        component: AdminOrdersComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'orders.read' },
      },

      {
        path: 'drivers',
        component: DriversComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'drivers.read' },
      },

      {
        path: 'payments',
        component: PaymentsComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'payments.read' },
      },

      {
        path: 'pricing',
        component: PricingComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'pricing.read' },
      },

      {
        path: 'notifications',
        component: NotificationsComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'notifications.read' },
      },

      {
        path: 'support',
        component: SupportComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'support.read' },
      },

      {
        path: 'roles',
        component: RolesComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'users.read' },
      },

      {
        path: 'settings',
        component: SettingsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
