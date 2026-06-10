import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingModalComponent } from './components/onboarding-modal/onboarding-modal.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { OrderMapComponent } from './components/order-map/order-map.component';
import { ToastComponent } from './components/toast/toast.component';
import {
  LucideAngularModule,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-angular';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    OnboardingModalComponent,
    PaginationComponent,
    OrderMapComponent,
    ToastComponent,
    ConfirmModalComponent,
    ThemeToggleComponent,
  ],
  imports: [CommonModule, RouterModule, LucideAngularModule],
  exports: [
    HeaderComponent,
    FooterComponent,
    OnboardingModalComponent,
    PaginationComponent,
    OrderMapComponent,
    ToastComponent,
    ThemeToggleComponent,
  ],
})
export class SharedModule {}
