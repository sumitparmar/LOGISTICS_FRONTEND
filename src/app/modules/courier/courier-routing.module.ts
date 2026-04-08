import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourierComponent } from './courier.component';

const routes: Routes = [{ path: '', component: CourierComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourierRoutingModule { }
