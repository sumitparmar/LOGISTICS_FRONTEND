import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZeroToleranceRoutingModule } from './zero-tolerance-routing.module';
import { ZeroToleranceComponent } from './zero-tolerance.component';

@NgModule({
  declarations: [ZeroToleranceComponent],
  imports: [CommonModule, ZeroToleranceRoutingModule],
})
export class ZeroToleranceModule {}
