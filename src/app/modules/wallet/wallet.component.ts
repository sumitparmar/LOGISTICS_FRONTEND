import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  pagination: any = null;

  summary: any = null;
  ledger: any[] = [];

  searchTerm = '';
  selectedType = 'ALL';
  currentPage = 1;
  pageSize = 20;
  showAddMoneyModal = false;

  showWithdrawModal = false;

  withdrawPayload = {
    amount: null as number | null,
    reason: 'WITHDRAWAL',
  };

  addMoneyPayload = {
    amount: null as number | null,
    reason: 'TOPUP',
  };
  loading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get('/payments/summary').subscribe({
      next: (summaryRes: any) => {
        this.summary = summaryRes?.data || null;

        const params = new URLSearchParams();

        params.set('page', this.currentPage.toString());
        params.set('limit', this.pageSize.toString());

        if (this.selectedType !== 'ALL') {
          params.set('type', this.selectedType);
        }

        if (this.searchTerm.trim()) {
          params.set('search', this.searchTerm.trim());
        }

        this.api.get(`/payments/ledger?${params.toString()}`).subscribe({
          next: (ledgerRes: any) => {
            this.ledger = ledgerRes?.data?.items || [];
            this.pagination = ledgerRes?.data?.pagination || null;
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
        this.errorMessage =
          err?.error?.message || 'Unable to load wallet summary.';
      },
    });
  }

  // get creditTransactions(): number {
  //   return this.ledger.filter((x) => x.type === 'CREDIT').length;
  // }

  // get debitTransactions(): number {
  //   return this.ledger.filter((x) => x.type === 'DEBIT').length;
  // }

  getStatusClass(status: string): string {
    return (status || '').toLowerCase();
  }

  getTransactionIcon(type: string): string {
    return type === 'CREDIT' ? '↗' : '↘';
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
    this.loadWallet();
  }

  openAddMoney(): void {
    this.showAddMoneyModal = true;
  }

  closeAddMoney(): void {
    this.showAddMoneyModal = false;

    this.addMoneyPayload = {
      amount: null,
      reason: 'TOPUP',
    };
  }

  openWithdrawModal(): void {
    this.showWithdrawModal = true;
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;

    this.withdrawPayload = {
      amount: null,
      reason: 'WITHDRAWAL',
    };
  }

  submitAddMoney(): void {
    if (!this.addMoneyPayload.amount || this.addMoneyPayload.amount <= 0) {
      alert('Enter valid amount');
      return;
    }

    this.loading = true;

    this.api
      .post('/payments/payin', {
        amount: this.addMoneyPayload.amount,
        reason: this.addMoneyPayload.reason,
      })
      .subscribe({
        next: () => {
          this.closeAddMoney();
          this.loadWallet();
        },
        error: (err) => {
          this.loading = false;

          alert(err?.error?.message || 'Unable to add money');
        },
      });
  }

  submitWithdraw(): void {
    if (!this.withdrawPayload.amount || this.withdrawPayload.amount <= 0) {
      alert('Enter valid amount');
      return;
    }

    this.loading = true;

    this.api
      .post('/payments/payout', {
        amount: this.withdrawPayload.amount,
        reason: this.withdrawPayload.reason,
      })
      .subscribe({
        next: () => {
          this.closeWithdrawModal();
          this.loadWallet();
        },
        error: (err) => {
          this.loading = false;

          alert(err?.error?.message || 'Unable to withdraw money');
        },
      });
  }
}
