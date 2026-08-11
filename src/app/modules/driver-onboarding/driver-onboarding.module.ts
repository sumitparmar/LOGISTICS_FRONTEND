import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DriverOnboardingRoutingModule } from './driver-onboarding-routing.module';
import { DriverOnboardingComponent } from './driver-onboarding.component';

@NgModule({
  declarations: [DriverOnboardingComponent],
  imports: [CommonModule, ReactiveFormsModule, DriverOnboardingRoutingModule],
})
export class DriverOnboardingModule {}
