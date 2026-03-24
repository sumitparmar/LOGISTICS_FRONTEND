import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { TableControlsComponent } from './components/table-controls/table-controls.component';
import { AdminOrdersComponent } from './pages/orders/admin-orders.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastComponent } from './components/toast/toast.component';

import {
  LucideAngularModule,
  Home,
  Users,
  ShoppingCart,
  Search,
  DollarSign,
  Edit,
  Trash,
} from 'lucide-angular';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AdminUserEditComponent } from './pages/user-edit/user-edit.component';
import { UserFormComponent } from './pages/users/user-form/user-form.component';
import { AdminUserCreateComponent } from './pages/user-create/user-create.component';
@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    TableControlsComponent,
    AdminOrdersComponent,
    DataTableComponent,
    ConfirmDialogComponent,
    AdminUserEditComponent,
    ToastComponent,
    UserFormComponent,
    AdminUserCreateComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AdminRoutingModule,
    NgChartsModule,

    LucideAngularModule.pick({
      Home,
      Users,
      ShoppingCart,
      Search,
      DollarSign,
      Edit,
      Trash,
    }),
  ],
})
export class AdminModule {}
