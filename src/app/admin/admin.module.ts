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
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { FormsModule } from '@angular/forms';

import { OrderDetailsComponent } from '../features/admin/order-details/order-details.component';
import {
  LucideAngularModule,
  Home,
  Users,
  ShoppingCart,
  Search,
  DollarSign,
  Edit,
  Trash,
  Truck,
  CreditCard,
  Tag,
  Bell,
  LifeBuoy,
  Settings,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-angular';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AdminUserEditComponent } from './pages/user-edit/user-edit.component';
import { UserFormComponent } from './pages/users/user-form/user-form.component';
import { AdminUserCreateComponent } from './pages/user-create/user-create.component';
import { SharedModule } from '../shared/shared.module';
import { DriversComponent } from './pages/drivers/drivers.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { SupportComponent } from './pages/support/support.component';
import { RolesComponent } from './pages/roles/roles.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { HighlightPipe } from './pipes/highlight.pipe';

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
    KpiCardComponent,
    OrderDetailsComponent,
    DriversComponent,
    PaymentsComponent,
    PricingComponent,
    NotificationsComponent,
    SupportComponent,
    RolesComponent,
    SettingsComponent,
    HighlightPipe,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AdminRoutingModule,
    NgChartsModule,
    FormsModule,
    SharedModule,

    LucideAngularModule.pick({
      Home,
      Users,
      ShoppingCart,
      Search,
      DollarSign,
      Edit,
      Trash,
      Truck,
      CreditCard,
      Tag,
      Bell,
      LifeBuoy,
      Shield,
      Settings,
      UserCheck,
      UserX,
    }),
  ],
})
export class AdminModule {}
