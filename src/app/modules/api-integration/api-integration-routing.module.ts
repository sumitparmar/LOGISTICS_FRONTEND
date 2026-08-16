import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiIntegrationComponent } from './api-integration.component';

const routes: Routes = [{ path: '', component: ApiIntegrationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApiIntegrationRoutingModule {}
