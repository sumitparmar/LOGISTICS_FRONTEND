import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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
import { SecureInfoDialogComponent } from './components/secure-info-dialog/secure-info-dialog.component';
import { PriceDialogComponent } from './components/price-dialog/price-dialog.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    HeroComponent,
    SecureInfoDialogComponent,
    PriceDialogComponent,
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
  ],
})
export class LandingModule {}
