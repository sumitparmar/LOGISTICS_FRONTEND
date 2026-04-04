import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';

import {
  HttpClientModule,
  HttpClient,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { SharedModule } from './shared/shared.module';
import { PublicLayoutComponent } from './modules/public-layout/pages/public-layout/public-layout.component';
import { NgChartsModule } from 'ng2-charts';

import {
  LucideAngularModule,
  CheckCircle,
  Edit,
  Trash,
  Users,
  ShoppingCart,
  DollarSign,
} from 'lucide-angular';
export function HttpLoaderFactory(http: HttpClient) {}

@NgModule({
  declarations: [AppComponent, PublicLayoutComponent],

  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgChartsModule,

    LucideAngularModule.pick({
      CheckCircle,
      Edit,
      Trash,
      Users,
      ShoppingCart,
      DollarSign,
    }),
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}
