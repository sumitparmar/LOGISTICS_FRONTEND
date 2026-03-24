import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminOrdersComponent } from './pages/orders/admin-orders.component';
import { AdminUserEditComponent } from './pages/user-edit/user-edit.component';
import { AdminUserCreateComponent } from './pages/user-create/user-create.component';
import { AdminGuard } from '../core/guards/admin.guard';

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
