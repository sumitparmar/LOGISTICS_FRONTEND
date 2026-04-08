import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RefundPolicyComponent } from './refund-policy.component';
import { RefundPolicyRoutingModule } from './refund-policy-routing.module';

@NgModule({
  declarations: [RefundPolicyComponent],
  imports: [CommonModule, RefundPolicyRoutingModule],
})
export class RefundPolicyModule {}
