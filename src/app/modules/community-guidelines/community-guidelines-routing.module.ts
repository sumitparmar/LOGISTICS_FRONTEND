import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommunityGuidelinesComponent } from './community-guidelines.component';

const routes: Routes = [{ path: '', component: CommunityGuidelinesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunityGuidelinesRoutingModule {}
