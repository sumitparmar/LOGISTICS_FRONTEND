import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SupportCenterComponent } from './pages/support-center/support-center.component';
import { SupportRoutingModule } from './support-routing.module';

@NgModule({
  declarations: [SupportCenterComponent],
  imports: [CommonModule, FormsModule, SharedModule, SupportRoutingModule],
})
export class SupportModule {}
