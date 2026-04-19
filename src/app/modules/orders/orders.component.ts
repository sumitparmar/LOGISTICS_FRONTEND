import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OrdersService,
  OrdersResponse,
} from '../../core/services/orders.service';
import { Subscription } from 'rxjs';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  readonly ACTIVE_STATUSES = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  statusFlow = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
  totalPages = 0;
  page = 1;
  limit = 10;
  total = 0;
  showCancelModal = false;
  orderToCancel: string | null = null;
  stats = {
    total: 0,
    active: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders: any[] = [];
  filteredOrders: any[] = [];
  loading = false;

  statusFilter: string | null = null;
  searchText = '';

  private routeSub!: Subscription;

  constructor(
    private ordersService: OrdersService,
    private route: ActivatedRoute,
    private router: Router,
    private analytics: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe((params) => {
      this.statusFilter = params['status'] || null;
      this.searchText = params['search'] || '';
      this.page = 1;

      this.loadOrders();
    });
  }

  trackOrderEvent(order: any) {
    if (!order?._id) return;

    this.analytics.trackEvent('track_order_clicked', {
      orderId: order._id,
    });

    this.router.navigate(['/track'], {
      queryParams: { orderId: order._id },
    });
  }

  loadOrders(): void {
    if (this.loading) return;
    this.loading = true;

    const query: any = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    if (this.searchText) {
      query.search = this.searchText;
    }

    if (this.statusFilter === 'ACTIVE') {
      query.statuses = this.ACTIVE_STATUSES.join(',');
    } else if (this.statusFilter) {
      query.status = this.statusFilter;
    }

    this.ordersService.getOrders(query).subscribe({
      next: (res: OrdersResponse) => {
        const data = res?.data || [];

        this.orders = data;

        //  TEMP REMOVE FILTER (IMPORTANT)
        this.filteredOrders = this.orders;

        this.total = res?.meta?.total || 0;

        this.totalPages = Math.ceil(this.total / this.limit);

        if (res?.meta?.stats) {
          this.stats.total = res.meta.stats.total;
          this.stats.active = res.meta.stats.active;
          this.stats.delivered = res.meta.stats.delivered;
          this.stats.cancelled = res.meta.stats.cancelled;
        }

        this.loading = false;
      },

      error: (err) => {
        console.error('Orders load failed', err);
        this.loading = false;
      },
    });
  }

  sort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }

    this.loadOrders();
  }

  searchTimeout: any;

  applyStatusFilter(): void {
    if (!this.statusFilter) {
      this.filteredOrders = this.orders;
      return;
    }

    this.filteredOrders = this.orders.filter(
      (order) => order.status === this.statusFilter,
    );
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchText || null,
        },
        queryParamsHandling: 'merge',
      });
    }, 400);
  }

  setStatusFilter(status: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null },
      queryParamsHandling: 'merge',
    });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  openCancelModal(orderId: string): void {
    this.orderToCancel = orderId;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.orderToCancel = null;
  }

  confirmCancel(): void {
    if (!this.orderToCancel) return;

    this.analytics.trackEvent('cancel_order_clicked', {
      orderId: this.orderToCancel,
    });

    this.ordersService.cancelOrder(this.orderToCancel).subscribe({
      next: () => {
        this.closeCancelModal();
        this.page = 1;
        this.loadOrders();
      },
      error: (err) => {
        console.error('Cancel order failed', err);
        this.closeCancelModal();
      },
    });
  }

  getStatusIndex(status: string): number {
    return this.statusFlow.indexOf(status);
  }

  getVehicleIcon(id: number): string {
    switch (id) {
      case 1:
        return '🛺';

      case 2:
        return '🚚';

      case 3:
        return '🚛';

      case 5:
        return '🚐';

      case 8:
        return '🏍️';

      default:
        return '🚚';
    }
  }

  getVehicleLabel(id: number): string {
    switch (id) {
      case 1:
        return 'Mini 3-Wheeler';

      case 2:
        return 'Tata Ace 8ft';

      case 3:
        return 'Tata Ace 7ft';

      case 5:
        return 'Tempo Truck';

      case 8:
        return 'Motorbike';

      default:
        return 'Assigned Vehicle';
    }
  }

  getEstimatedDuration(order: any): string {
    const eta =
      order?.rawProviderResponse?.order?.points?.[1]
        ?.estimated_arrival_datetime;

    if (eta) {
      return eta;
    }

    return 'Awaiting ETA';
  }

  openOrder(id: string): void {
    this.analytics.trackEvent('view_order_details', {
      orderId: id,
    });

    this.router.navigate(['/app/orders', id]);
  }
  createDeliveryClick() {
    this.analytics.trackEvent('create_order_clicked');

    this.router.navigate(['/app/delivery/create']);
  }
  trackByOrder(index: number, order: any) {
    return order._id;
  }

  onPageChange(page: number) {
    if (page === this.page) return; // 🔥 prevent loop
    this.page = page;
    this.loadOrders();
  }

  onLimitChange(limit: number) {
    if (limit === this.limit) return;
    this.limit = limit;
    this.page = 1;
    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }

    clearTimeout(this.searchTimeout);
  }
}
