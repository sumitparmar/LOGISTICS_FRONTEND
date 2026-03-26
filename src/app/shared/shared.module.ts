import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingModalComponent } from './components/onboarding-modal/onboarding-modal.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { OrderMapComponent } from './components/order-map/order-map.component';
@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    OnboardingModalComponent,
    PaginationComponent,
    OrderMapComponent,
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    HeaderComponent,
    FooterComponent,
    OnboardingModalComponent,
    PaginationComponent,
    OrderMapComponent,
  ],
})
export class SharedModule {}
