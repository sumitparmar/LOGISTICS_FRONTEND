import { APP_INITIALIZER, NgModule } from '@angular/core';
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
import { RuntimeConfigService } from './core/services/runtime-config.service';

import {
  LucideAngularModule,
  CheckCircle,
  Edit,
  Trash,
  Users,
  ShoppingCart,
  DollarSign,
  UserCheck,
  UserX,
  XCircle,
  AlertTriangle,
} from 'lucide-angular';
export function HttpLoaderFactory(http: HttpClient) {}
export function runtimeConfigFactory(config: RuntimeConfigService) {
  return () => config.load();
}

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
      UserCheck,
      UserX,
      XCircle,
      AlertTriangle,
    }),
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: runtimeConfigFactory,
      deps: [RuntimeConfigService],
      multi: true,
    },
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}
