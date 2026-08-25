import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { OrdersRoutingModule } from './orders-routing.module';
import { OrdersComponent } from './orders.component';
import { OrderDetailsComponent } from './pages/order-details/order-details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatIconModule } from '@angular/material/icon';
@NgModule({
  declarations: [OrdersComponent, OrderDetailsComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, OrdersRoutingModule, SharedModule],
})
export class OrdersModule {}
