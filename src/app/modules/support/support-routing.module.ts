import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupportCenterComponent } from './pages/support-center/support-center.component';

const routes: Routes = [
  {
    path: '',
    component: SupportCenterComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupportRoutingModule {}
