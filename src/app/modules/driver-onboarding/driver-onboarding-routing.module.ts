import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverOnboardingComponent } from './driver-onboarding.component';

const routes: Routes = [{ path: '', component: DriverOnboardingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverOnboardingRoutingModule {}
