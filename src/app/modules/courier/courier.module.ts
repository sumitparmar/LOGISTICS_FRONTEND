import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CourierRoutingModule } from './courier-routing.module';
import { CourierComponent } from './courier.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [CourierComponent],
  imports: [CommonModule, CourierRoutingModule, FormsModule],
})
export class CourierModule {}
