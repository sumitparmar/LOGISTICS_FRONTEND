import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [WalletComponent],
  imports: [CommonModule, FormsModule, WalletRoutingModule, SharedModule],
})
export class WalletModule {}
