import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminOrdersService } from '../../services/admin-orders.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
interface PaymentRecord {
  orderId: string;
  customer: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit {
  isLoading = false;
  isExporting = false;
  isReconciling = false;

  lastReconciledAt = '';

  page = 1;
  limit = 10;
  total = 0;
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  records: PaymentRecord[] = [];
  allRecords: PaymentRecord[] = [];

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
    private ordersService: AdminOrdersService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  loadPayments(): void {
    this.isLoading = true;

    this.ordersService.getOrders(1, 1000, this.filters.search).subscribe({
      next: (res: any) => {
        const rawOrders = res.data || [];

        const mapped = rawOrders.map((item: any) => {
          const paymentStatus =
            item.status === 'DELIVERED'
              ? 'Collected'
              : item.status === 'CANCELLED'
                ? 'Failed'
                : 'Pending';

          return {
            orderId: item.borzoOrderId || '-',
            customer: item.customer?.name || '-',
            amount: item.pricing?.amount || 0,
            type: 'COD',
            status: paymentStatus,
            createdAt: this.formatDate(item.createdAt),
          };
        });
        this.allRecords = this.applyFrontendFilters(mapped);
        this.total = res.pagination?.total || this.allRecords.length;

        this.sortRecords();
        this.applyPagination();
        this.buildSummary(this.allRecords);

        this.isLoading = false;
      },
      error: () => {
        this.records = [];
        this.allRecords = [];
        this.total = 0;
        this.resetSummary();
        this.isLoading = false;
      },
    });
  }

  applyPagination(): void {
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;

    this.records = this.allRecords.slice(start, end);
  }

  sortRecords(): void {
    this.allRecords.sort((a: any, b: any) => {
      let first = a[this.sortBy];
      let second = b[this.sortBy];

      if (this.sortBy === 'amount') {
        first = Number(first);
        second = Number(second);
      }

      if (first < second) {
        return this.sortOrder === 'asc' ? -1 : 1;
      }

      if (first > second) {
        return this.sortOrder === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }

  applyFrontendFilters(data: PaymentRecord[]): PaymentRecord[] {
    let rows = [...data];

    if (this.filters.status !== 'All') {
      rows = rows.filter((x) => x.status === this.filters.status);
    }

    if (this.filters.date) {
      rows = rows.filter((x) => x.createdAt.includes(this.filters.date));
    }

    return rows;
  }

  buildSummary(data: PaymentRecord[]): void {
    this.summary.totalCodOrders = this.total;
    this.summary.pendingCollection = data
      .filter((x) => x.status === 'Pending')
      .reduce((sum, x) => sum + x.amount, 0);

    this.summary.collectedAmount = data
      .filter((x) => x.status === 'Collected')
      .reduce((sum, x) => sum + x.amount, 0);

    this.summary.refundQueue = 0;
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
    this.applyPagination();
  }

  onSearchChange(search: string): void {
    this.filters.search = search;
    this.page = 1;
    this.loadPayments();
  }

  onLimitChange(limit: string): void {
    this.limit = Number(limit);
    this.page = 1;
    this.applyPagination();
  }

  exportPayments(): void {
    if (this.isExporting) return;

    this.isExporting = true;

    const params: any = {
      type: 'payments',
      search: this.filters.search || '',
      status: this.filters.status === 'All' ? '' : this.filters.status,
    };

    this.ordersService.exportCSV(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'payments-export.csv';
        a.click();

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

    this.sortRecords();
    this.applyPagination();
  }

  reconcilePayments(): void {
    if (this.isReconciling) return;

    this.isReconciling = true;

    this.loadPayments();

    setTimeout(() => {
      this.lastReconciledAt = new Date().toLocaleString();
      this.isReconciling = false;
    }, 700);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toISOString().split('T')[0];
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
      .then(() => {
        this.toastService.success('Order ID copied');
      })
      .catch(() => {
        this.toastService.error('Copy failed');
      });
  }
}
