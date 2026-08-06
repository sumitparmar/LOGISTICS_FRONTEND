import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingModalComponent } from './components/onboarding-modal/onboarding-modal.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { OrderMapComponent } from './components/order-map/order-map.component';
import { ToastComponent } from './components/toast/toast.component';
import { MatDialogModule } from '@angular/material/dialog';
import {
  LucideAngularModule,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-angular';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { LocationPickerComponent } from './components/location-picker/location-picker.component';
import { LocationPickerDialogComponent } from './components/location-picker-dialog/location-picker-dialog.component';
import { LocationPickerModalComponent } from './components/location-picker-modal/location-picker-modal.component';

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
    LocationPickerComponent,
    LocationPickerDialogComponent,
    LocationPickerModalComponent,
  ],
  imports: [CommonModule, RouterModule, LucideAngularModule, MatDialogModule],
  exports: [
    HeaderComponent,
    FooterComponent,
    OnboardingModalComponent,
    PaginationComponent,
    OrderMapComponent,
    ToastComponent,
    ConfirmModalComponent,
    ThemeToggleComponent,
    LocationPickerModalComponent,
  ],
})
export class SharedModule {}
