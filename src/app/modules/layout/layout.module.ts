import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing.module';
import { ShellComponent } from './pages/shell/shell.component';

import { SharedModule } from '../../shared/shared.module';
import { CustomerSidebarComponent } from './components/customer-sidebar/customer-sidebar.component';
import { CustomerTopbarComponent } from './components/customer-topbar/customer-topbar.component';

@NgModule({
  declarations: [ShellComponent, CustomerSidebarComponent, CustomerTopbarComponent],
  imports: [CommonModule, LayoutRoutingModule, SharedModule],
})
export class LayoutModule {}
