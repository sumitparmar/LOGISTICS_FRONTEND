import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ZeroToleranceComponent } from './zero-tolerance.component';

const routes: Routes = [{ path: '', component: ZeroToleranceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ZeroToleranceRoutingModule {}
