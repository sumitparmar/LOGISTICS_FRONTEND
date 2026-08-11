import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  };
  summary: any = null;
  ledger: any[] = [];

  searchTerm = '';

  selectedType = 'ALL';

  selectedCategory = 'ALL';

  selectedStatus = 'ALL';

  fromDate = '';

  toDate = '';

  sortBy = 'createdAt';

  sortOrder: 'asc' | 'desc' = 'desc';

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

  constructor(
    private api: ApiService,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get('/payments/summary').subscribe({
      next: (summaryRes: any) => {
        this.summary = summaryRes?.data || null;

        const params = this.buildLedgerParams();

        this.api.get(`/payments/ledger?${params.toString()}`).subscribe({
          next: (ledgerRes: any) => {
            this.ledger = ledgerRes?.data?.items || [];
            this.pagination = ledgerRes?.data?.pagination ?? {
              page: 1,
              limit: 20,
              total: 0,
              pages: 0,
            };
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

  private buildLedgerParams(): URLSearchParams {
    const params = new URLSearchParams();

    params.set('page', String(this.currentPage));
    params.set('limit', String(this.pageSize));

    if (this.selectedType !== 'ALL') {
      params.set('type', this.selectedType);
    }

    if (this.selectedCategory !== 'ALL') {
      params.set('category', this.selectedCategory);
    }

    if (this.selectedStatus !== 'ALL') {
      params.set('status', this.selectedStatus);
    }

    if (this.searchTerm.trim()) {
      params.set('search', this.searchTerm.trim());
    }

    if (this.fromDate) {
      params.set('fromDate', this.fromDate);
    }

    if (this.toDate) {
      params.set('toDate', this.toDate);
    }

    params.set('sortBy', this.sortBy);
    params.set('sortOrder', this.sortOrder);

    return params;
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
    if (this.loading) {
      return;
    }

    if (!this.addMoneyPayload.amount || this.addMoneyPayload.amount <= 0) {
      this.toast.warning('Enter a valid amount');
      return;
    }

    if (this.addMoneyPayload.amount > 100000) {
      this.toast.warning('Maximum allowed amount is INR 100000');
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

          this.toast.error(err?.error?.message || 'Unable to add money');
        },
      });
  }

  submitWithdraw(): void {
    if (this.loading) {
      return;
    }

    if (!this.withdrawPayload.amount || this.withdrawPayload.amount <= 0) {
      this.toast.warning('Enter a valid amount');
      return;
    }

    if (
      this.withdrawPayload.amount > (this.summary?.withdrawableBalance || 0)
    ) {
      this.toast.warning('Amount exceeds withdrawable balance');
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

          this.toast.error(err?.error?.message || 'Unable to withdraw money');
        },
      });
  }

  downloadStatement(): void {
    this.loading = true;

    this.api.download('/payments/statement').subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `wallet-statement-${new Date()
          .toISOString()
          .substring(0, 10)}.xlsx`;

        document.body.appendChild(link);

        if (typeof link.click === 'function') {
          link.click();
        } else {
          window.location.href = url;
        }

        document.body.removeChild(link);

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err?.error?.message || 'Unable to download statement.');
      },
    });
  }

  goToSupport(): void {
    this.router.navigate(['/app/support']);
  }
}
