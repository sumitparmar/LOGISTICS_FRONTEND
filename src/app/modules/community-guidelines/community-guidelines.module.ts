import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommunityGuidelinesComponent } from './community-guidelines.component';
import { CommunityGuidelinesRoutingModule } from './community-guidelines-routing.module';

@NgModule({
  declarations: [CommunityGuidelinesComponent],
  imports: [CommonModule, CommunityGuidelinesRoutingModule],
})
export class CommunityGuidelinesModule {}
