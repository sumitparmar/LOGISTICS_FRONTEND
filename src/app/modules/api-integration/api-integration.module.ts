import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiIntegrationRoutingModule } from './api-integration-routing.module';
import { ApiIntegrationComponent } from './api-integration.component';

@NgModule({
  declarations: [ApiIntegrationComponent],
  imports: [CommonModule, ApiIntegrationRoutingModule],
})
export class ApiIntegrationModule {}
