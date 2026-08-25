import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecureInfoDialogComponent } from './components/secure-info-dialog/secure-info-dialog.component';

import { LandingRoutingModule } from './landing-routing.module';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { HeroComponent } from './components/hero/hero.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { PriceDialogComponent } from './components/price-dialog/price-dialog.component';
import { PromoSliderComponent } from './components/promo-slider/promo-slider.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    LandingPageComponent,
    HeroComponent,
    SecureInfoDialogComponent,
    PriceDialogComponent,
    PromoSliderComponent,
  ],
  imports: [
    CommonModule,
    LandingRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
    SharedModule,
  ],
})
export class LandingModule {}
