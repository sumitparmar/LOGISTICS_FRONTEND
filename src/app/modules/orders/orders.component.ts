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
  filteredOrders: any[] = [];
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

    const query: any = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    if (this.searchText) {
      query.search = this.searchText;
    }

    if (this.statusFilter) {
      query.status = this.statusFilter;
    }
    console.log('Orders query:', query);

    this.ordersService.getOrders(query).subscribe({
      next: (res: OrdersResponse) => {
        const data = res?.data || [];

        this.orders = data;
        this.applyStatusFilter();

        this.total = res?.meta?.total || 0;
        this.page = res?.meta?.page || this.page;

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
    this.statusFilter = status;
    this.applyStatusFilter();
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
        return '🏍️'; // Bike

      case 2:
        return '🚚'; // Mini Truck

      case 3:
        return '🚛'; // Truck

      default:
        return '🚚';
    }
  }

  getVehicleLabel(id: number): string {
    switch (id) {
      case 1:
        return 'Bike';

      case 2:
        return 'Mini Truck';

      case 3:
        return 'Truck';

      default:
        return 'Vehicle';
    }
  }

  getEstimatedDuration(order: any): string {
    const points = order?.rawProviderResponse?.order?.points;

    if (!points || points.length < 2) return 'Calculating';

    const pickup = points[0];
    const drop = points[1];

    if (!pickup?.latitude || !drop?.latitude) return 'Calculating';

    const lat1 = Number(pickup.latitude);
    const lng1 = Number(pickup.longitude);
    const lat2 = Number(drop.latitude);
    const lng2 = Number(drop.longitude);

    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    const avgSpeed = 30;

    const durationMinutes = Math.round((distance / avgSpeed) * 60);

    return durationMinutes + ' mins';
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
