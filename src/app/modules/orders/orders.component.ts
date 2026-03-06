import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OrdersService,
  OrdersResponse,
} from '../../core/services/orders.service';
import { Subscription } from 'rxjs';

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

  stats = {
    total: 0,
    active: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders: any[] = [];
  loading = false;

  statusFilter: string | null = null;
  searchText = '';

  private routeSub!: Subscription;

  constructor(
    private ordersService: OrdersService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe((params) => {
      this.statusFilter = params['status'] || null;

      this.loadOrders();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadOrders(): void {
    this.loading = true;

    const query = {
      page: this.page,
      limit: this.limit,
      search: this.searchText || undefined,
      status: this.statusFilter || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    this.ordersService.getOrders(query).subscribe({
      next: (res: OrdersResponse) => {
        const data = res?.data || [];

        this.orders = data;

        this.total = res?.meta?.total || 0;
        this.page = res?.meta?.page || this.page;
        // this.limit = res?.meta?.limit || this.limit;

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

  // calculateStats(orders: any[]): void {
  //   this.stats.active = orders.filter((o) =>
  //     this.ACTIVE_STATUSES.includes(o.status),
  //   ).length;

  //   this.stats.delivered = orders.filter(
  //     (o) => o.status === 'DELIVERED',
  //   ).length;

  //   this.stats.cancelled = orders.filter(
  //     (o) => o.status === 'CANCELLED',
  //   ).length;
  // }
  searchTimeout: any;

  onSearch(): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;

      this.loadOrders();
    }, 400);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.page = page;

    this.loadOrders();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;

    this.page++;

    this.loadOrders();
  }

  prevPage(): void {
    if (this.page <= 1) return;

    this.page--;

    this.loadOrders();
  }

  setStatusFilter(status: string | null): void {
    this.page = 1;

    this.router.navigate([], {
      queryParams: { status },
      queryParamsHandling: 'merge',
    });
  }

  cancelOrder(orderId: string): void {
    if (!confirm('Cancel this order?')) return;

    this.ordersService.cancelOrder(orderId).subscribe({
      next: () => this.loadOrders(),

      error: (err) => console.error('Cancel order failed', err),
    });
  }

  getStatusIndex(status: string): number {
    return this.statusFlow.indexOf(status);
  }

  getVehicleIcon(id: number): string {
    switch (id) {
      case 1:
        return '🛵';
      case 2:
        return '🛺';
      case 3:
        return '🚚';
      case 4:
        return '🚛';
      default:
        return '🚚';
    }
  }

  getVehicleLabel(id: number): string {
    switch (id) {
      case 1:
        return 'Bike';
      case 2:
        return 'Auto';
      case 3:
        return 'Mini Truck';
      case 4:
        return 'Van';
      default:
        return 'Vehicle';
    }
  }

  openOrder(id: string): void {
    this.router.navigate(['/app/orders', id]);
  }

  trackByOrder(index: number, order: any) {
    return order._id;
  }
  changePage(newPage: number): void {
    if (newPage < 1) return;

    if (newPage > this.getTotalPages()) return;

    this.page = newPage;

    this.loadOrders();
  }

  getTotalPages(): number {
    return Math.ceil(this.total / this.limit);
  }
}
