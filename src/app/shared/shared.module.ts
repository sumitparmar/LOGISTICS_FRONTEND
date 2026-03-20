import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingModalComponent } from './components/onboarding-modal/onboarding-modal.component';

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [HeaderComponent, FooterComponent, OnboardingModalComponent],
  imports: [CommonModule, RouterModule],
  exports: [HeaderComponent, FooterComponent, OnboardingModalComponent],
})
export class SharedModule {}
