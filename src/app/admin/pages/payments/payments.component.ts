import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { AdminSocketService } from '../../services/admin-socket.service';
import {
  AdminPaymentRecord,
  AdminPaymentsService,
} from '../../services/admin-payments.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private requestId = 0;

  isLoading = false;
  isExporting = false;
  isReconciling = false;
  errorMessage = '';
  reconciliationMessage = '';
  lastReconciledAt = '';

  page = 1;
  limit = 10;
  total = 0;
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  records: AdminPaymentRecord[] = [];

  summary = {
    totalCodOrders: 0,
    pendingCollection: 0,
    collectedAmount: 0,
    refundQueue: 0,
  };

  filters = {
    search: '',
    status: 'All',
    type: 'COD',
    date: '',
  };

  constructor(
    private paymentsService: AdminPaymentsService,
    private router: Router,
    private toastService: ToastService,
    private socketService: AdminSocketService,
  ) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filters.search = search;
        this.page = 1;
        this.loadPayments();
      });

    this.loadPayments();
    this.socketService.orderUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPayments());
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  loadPayments(): void {
    const currentRequestId = ++this.requestId;
    this.isLoading = true;
    this.errorMessage = '';

    this.paymentsService
      .getPayments(
        this.page,
        this.limit,
        this.filters.search,
        this.filters.status,
        this.filters.type,
        this.filters.date,
        this.sortBy,
        this.sortOrder,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (currentRequestId !== this.requestId) return;

          this.records = (res.data || []).map((record) => ({
            ...record,
            createdAt: this.formatDate(record.createdAt),
          }));
          this.total = Number(res.pagination?.total || 0);
          this.summary = {
            totalCodOrders: Number(res.summary?.totalCodOrders || 0),
            pendingCollection: Number(res.summary?.pendingCollection || 0),
            collectedAmount: Number(res.summary?.collectedAmount || 0),
            refundQueue: Number(res.summary?.refundQueue || 0),
          };
          this.isLoading = false;
        },
        error: (err) => {
          if (currentRequestId !== this.requestId) return;

          this.records = [];
          this.total = 0;
          this.resetSummary();
          this.errorMessage =
            err?.error?.message || 'Unable to load payment records.';
          this.isLoading = false;
        },
      });
  }

  resetSummary(): void {
    this.summary = {
      totalCodOrders: 0,
      pendingCollection: 0,
      collectedAmount: 0,
      refundQueue: 0,
    };
  }

  applyFilters(): void {
    this.filters.search = this.filters.search.trim();
    this.page = 1;
    this.loadPayments();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      status: 'All',
      type: 'COD',
      date: '',
    };
    this.page = 1;
    this.loadPayments();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadPayments();
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search.trim());
  }

  onLimitChange(limit: number): void {
    this.limit = Number(limit);
    this.page = 1;
    this.loadPayments();
  }

  exportPayments(): void {
    if (this.isExporting) return;

    this.isExporting = true;
    const params = {
      exportType: 'payments',
      search: this.filters.search || '',
      status: this.filters.status === 'All' ? '' : this.filters.status,
      type: this.filters.type === 'All' ? '' : this.filters.type,
      date: this.filters.date || '',
    };

    this.paymentsService.exportPayments(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'payments-export.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
        this.toastService.success('Payments exported successfully');
      },
      error: () => {
        this.isExporting = false;
        this.toastService.error('Export failed');
      },
    });
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }

    this.page = 1;
    this.loadPayments();
  }

  reconcilePayments(): void {
    if (this.isReconciling) return;

    this.isReconciling = true;
    this.reconciliationMessage = '';

    this.paymentsService
      .reconcilePayments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.lastReconciledAt = res.data?.completedAt
            ? new Date(res.data.completedAt).toLocaleString()
            : new Date().toLocaleString();
          this.reconciliationMessage = `${res.data?.mismatches || 0} mismatches found.`;
          this.isReconciling = false;
          this.toastService.success('Payments reconciled successfully');
          this.loadPayments();
        },
        error: (err) => {
          this.isReconciling = false;
          this.errorMessage =
            err?.error?.message || 'Payment reconciliation failed.';
          this.toastService.error(this.errorMessage);
        },
      });
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? '-'
      : parsed.toISOString().split('T')[0];
  }

  viewOrder(orderId: string): void {
    if (!orderId) return;
    this.router.navigate(['/admin/orders'], {
      queryParams: { search: orderId },
    });
  }

  copyOrderId(orderId: string): void {
    if (!orderId) return;

    navigator.clipboard
      .writeText(orderId)
      .then(() => this.toastService.success('Order ID copied'))
      .catch(() => this.toastService.error('Copy failed'));
  }

  trackByOrderId(_: number, item: AdminPaymentRecord): string {
    return item.orderId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
