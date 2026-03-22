import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrdersRoutingModule } from './orders-routing.module';
import { OrdersComponent } from './orders.component';
import { OrderDetailsComponent } from './pages/order-details/order-details.component';
import { SharedModule } from 'src/app/shared/shared.module';
@NgModule({
  declarations: [OrdersComponent, OrderDetailsComponent],
  imports: [CommonModule, FormsModule, OrdersRoutingModule, SharedModule],
})
export class OrdersModule {}
