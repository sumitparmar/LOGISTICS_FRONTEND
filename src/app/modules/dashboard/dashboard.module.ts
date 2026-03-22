import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component'; // ✅ ADD THIS
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from 'src/app/shared/shared.module';
@NgModule({
  declarations: [
    DashboardComponent,
    HomeComponent, // ✅ ADD THIS
  ],
  imports: [CommonModule, DashboardRoutingModule, MatCardModule, SharedModule],
})
export class DashboardModule {}
