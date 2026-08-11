import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CityRoutingModule } from './city-routing.module';
import { CityComponent } from './city.component';

@NgModule({
  declarations: [CityComponent],
  imports: [CommonModule, RouterModule, CityRoutingModule],
})
export class CityModule {}
