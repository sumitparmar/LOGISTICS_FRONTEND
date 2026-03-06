import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DeliveryRoutingModule } from './delivery-routing.module';
import { CreateDeliveryComponent } from './pages/create-delivery/create-delivery.component';

@NgModule({
  declarations: [CreateDeliveryComponent],
  imports: [
    CommonModule,
    DeliveryRoutingModule,
    ReactiveFormsModule,
    DragDropModule,
  ],
})
export class DeliveryModule {}
