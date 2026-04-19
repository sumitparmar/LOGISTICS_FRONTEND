import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrackRoutingModule } from './track-routing.module';
import { TrackOrderComponent } from './pages/track-order/track-order.component';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [TrackOrderComponent],
  imports: [
    CommonModule,
    TrackRoutingModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
})
export class TrackModule {}
