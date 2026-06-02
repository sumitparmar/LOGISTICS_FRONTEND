import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  wallet: any = null;
  ledger: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get('/payments/wallet').subscribe({
      next: (walletRes: any) => {
        this.wallet = walletRes?.data || null;

        this.api.get('/payments/ledger').subscribe({
          next: (ledgerRes: any) => {
            this.ledger = ledgerRes?.data || [];
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage =
              err?.error?.message || 'Unable to load wallet ledger.';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to load wallet.';
      },
    });
  }

}
