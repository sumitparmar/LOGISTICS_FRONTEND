import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../../services/dashboard.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { orderReference } from 'src/app/shared/utils/order-reference';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  walletBalance: number;
  walletCurrency: string;
}

interface StatusBreakdown {
  CREATED: number;
  ASSIGNED: number;
  PICKED_UP: number;
  IN_TRANSIT: number;
  DELIVERED: number;
  CANCELLED: number;
  FAILED: number;
}

interface SpendingPoint {
  month: string;
  year: number;
  total: number;
  count: number;
}

interface RecentOrder {
  id: string;
  borzoOrderId: string;
  pickup: string;
  drop: string;
  status: string;
  amount: number;
  currency: string;
  vehicleTypeId: number | null;
  time: string;
}

interface DashboardResponse {
  data: {
    totalOrders: number;
    activeOrders: number;
    walletBalance: number;
    walletCurrency: string;
    statusBreakdown: StatusBreakdown;
    spendingChart: SpendingPoint[];
    recentOrders: {
      id: string;
      borzoOrderId: string;
      pickup: string;
      drop: string;
      status: string;
      amount: number;
      currency: string;
      vehicleTypeId: number | null;
      createdAt: string;
    }[];
  };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private authService: AuthService,
  ) {}

  userName: string = '';

  dashboardStats: DashboardStats = {
    totalOrders: 0,
    activeOrders: 0,
    walletBalance: 0,
    walletCurrency: 'INR',
  };

  statusBreakdown: StatusBreakdown = {
    CREATED: 0,
    ASSIGNED: 0,
    PICKED_UP: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    FAILED: 0,
  };

  spendingChart: SpendingPoint[] = [];
  maxSpending: number = 0;

  allRecentOrders: RecentOrder[] = [];
  recentOrders: RecentOrder[] = [];
  page = 1;
  limit = 5;
  totalPages = 1;
  isLoading = false;
  hasError = false;

  // Status badge config
  readonly statusConfig: Record<string, { label: string; class: string }> = {
    CREATED: { label: 'Created', class: 'status-created' },
    ASSIGNED: { label: 'Assigned', class: 'status-assigned' },
    PICKED_UP: { label: 'Picked Up', class: 'status-picked' },
    IN_TRANSIT: { label: 'In Transit', class: 'status-transit' },
    DELIVERED: { label: 'Delivered', class: 'status-delivered' },
    CANCELLED: { label: 'Cancelled', class: 'status-cancelled' },
    FAILED: { label: 'Failed', class: 'status-failed' },
  };

  // Status strip config
  readonly statusStrip = [
    {
      key: 'DELIVERED',
      label: 'Delivered',
      color: 'var(--mk-success)',
      bg: 'var(--mk-success-soft)',
    },
    {
      key: 'IN_TRANSIT',
      label: 'In Transit',
      color: 'var(--mk-warning)',
      bg: 'var(--mk-warning-soft)',
    },
    {
      key: 'ASSIGNED',
      label: 'Assigned',
      color: 'var(--mk-info)',
      bg: 'var(--mk-info-soft)',
    },
    {
      key: 'PICKED_UP',
      label: 'Picked Up',
      color: 'var(--mk-primary)',
      bg: 'var(--mk-primary-soft)',
    },
    {
      key: 'CANCELLED',
      label: 'Cancelled',
      color: 'var(--mk-danger)',
      bg: 'var(--mk-danger-soft)',
    },
    {
      key: 'FAILED',
      label: 'Failed',
      color: 'var(--mk-danger)',
      bg: 'var(--mk-danger-soft)',
    },
    {
      key: 'CREATED',
      label: 'Created',
      color: 'var(--mk-text-secondary)',
      bg: 'var(--mk-surface-muted)',
    },
  ];

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userName = user.name || user.phone || 'there';

    this.loadDashboard();
  }

  reloadDashboard(): void {
    if (this.isLoading) {
      return;
    }

    this.loadDashboard();
  }

  private loadDashboard(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.page = 1;

    this.dashboardService.getSummary().subscribe({
      next: (response: DashboardResponse) => {
        if (!response?.data) {
          this.hasError = true;
          this.isLoading = false;
          return;
        }

        const data = response.data;

        this.dashboardStats = {
          totalOrders: data.totalOrders,
          activeOrders: data.activeOrders,
          walletBalance: data.walletBalance,
          walletCurrency: data.walletCurrency ?? 'INR',
        };

        this.statusBreakdown = data.statusBreakdown ?? this.statusBreakdown;

        this.spendingChart = data.spendingChart ?? [];
        this.maxSpending = this.spendingChart.length
          ? Math.max(...this.spendingChart.map((s) => s.total), 1)
          : 1;

        this.allRecentOrders = (data.recentOrders ?? []).map((order) => ({
          id: order.id,
          borzoOrderId: order.borzoOrderId,
          pickup: order.pickup,
          drop: order.drop,
          status: order.status,
          amount: order.amount,
          currency: order.currency ?? data.walletCurrency ?? 'INR',
          vehicleTypeId: order.vehicleTypeId,
          time: this.formatDate(order.createdAt),
        }));

        this.totalPages = Math.max(
          1,
          Math.ceil(this.allRecentOrders.length / this.limit),
        );
        this.updatePaginatedOrders();
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  private updatePaginatedOrders(): void {
    const start = (this.page - 1) * this.limit;
    this.recentOrders = this.allRecentOrders.slice(start, start + this.limit);
  }

  private formatDate(date: string): string {
    if (!date) return '—';

    const value = new Date(date);

    if (isNaN(value.getTime())) {
      return '—';
    }

    return value.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number, currency: string = 'INR'): string {
    if (amount === null || amount === undefined) {
      return `${currency} 0`;
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getStatusCount(key: string): number {
    return (this.statusBreakdown as any)[key] ?? 0;
  }

  getBarHeight(total: number): number {
    if (!this.maxSpending) return 0;
    return Math.max(4, Math.round((total / this.maxSpending) * 100));
  }

  getStatusConfig(status: string): { label: string; class: string } {
    return (
      this.statusConfig[status] ?? { label: status, class: 'status-created' }
    );
  }

  truncateId(id: string): string {
    return id ? `#${orderReference(id)}` : '—';
  }

  truncateAddress(address: string, maxLen = 28): string {
    if (!address || address === 'N/A') return '—';
    return address.length > maxLen ? address.slice(0, maxLen) + '…' : address;
  }

  // Navigation
  goToAllOrders(): void {
    this.router.navigate(['/app/orders']);
  }
  goToActiveOrders(): void {
    this.router.navigate(['/app/orders'], {
      queryParams: { status: 'ACTIVE' },
    });
  }
  // TEMP WALLET DISABLED:
  // Re-enable with the dashboard wallet card/quick action when the wallet
  // feature is ready for users again.
  // goToWallet(): void {
  //   this.router.navigate(['/app/wallet']);
  // }
  goToOrder(id: string): void {
    this.router.navigate(['/app/orders', id]);
  }
  goToBookDelivery(): void {
    this.router.navigate(['/app/delivery/create']);
  }

  // Pagination
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.updatePaginatedOrders();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.totalPages = Math.max(
      1,
      Math.ceil(this.allRecentOrders.length / this.limit),
    );
    this.updatePaginatedOrders();
  }

  trackByOrder(_: number, order: RecentOrder): string {
    return order.id;
  }
}
