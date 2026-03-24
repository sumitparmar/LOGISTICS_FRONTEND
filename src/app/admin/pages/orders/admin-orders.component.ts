import {
  Component,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';

import { AdminOrdersService } from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss'],
})
export class AdminOrdersComponent implements OnInit, AfterViewInit {
  // ===== Templates =====
  @ViewChild('statusTemplate', { static: true })
  statusTemplate!: TemplateRef<any>;

  @ViewChild('actionsTemplate', { static: true })
  actionsTemplate!: TemplateRef<any>;

  searchTerm: string = '';
  selectedStatus: string = 'ALL';
  page: number = 1;
  limit: number = 5;
  private _backendTotal: number = 0;

  columns: any[] = [];
  orders: any[] = [];
  allOrders: any[] = [];
  filteredOrders: any[] = [];
  statusCounts: any = {
    ALL: 0,
    CREATED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    IN_PROGRESS: 0,
  };

  showConfirm = false;
  selectedOrder: any = null;

  constructor(private ordersService: AdminOrdersService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.initializeColumns();
  }

  loadOrders(): void {
    this.ordersService.getOrders().subscribe({
      next: (res: any) => {
        this.allOrders = res?.data || [];

        this.calculateCounts();
        this.applyFilters();
      },
      error: (err: any) => {
        console.error('Orders API failed:', err);
        this.allOrders = [];
        this.applyFilters();
      },
    });
  }

  applyFilters(): void {
    let data = [...this.allOrders];

    if (this.selectedStatus !== 'ALL') {
      if (this.selectedStatus === 'IN_PROGRESS') {
        data = data.filter(
          (o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT',
        );
      } else {
        data = data.filter((o) => o.status === this.selectedStatus);
      }
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();

      data = data.filter(
        (o) =>
          String(o.borzoOrderId).includes(term) ||
          o.customer?.name?.toLowerCase().includes(term),
      );
    }

    this.filteredOrders = data;

    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;

    const paginated = data.slice(start, end);

    this.orders = paginated.map((o: any) => ({
      id: o.borzoOrderId || '-',
      user: o.customer?.name || '-',
      amount: `${o.pricing?.amount || 0} ${o.pricing?.currency || ''}`,
      status: o.status || '-',
    }));
  }

  calculateCounts(): void {
    const counts = {
      ALL: this.allOrders.length,
      CREATED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      IN_PROGRESS: 0,
    };

    for (const order of this.allOrders) {
      switch (order.status) {
        case 'CREATED':
          counts.CREATED++;
          break;

        case 'DELIVERED':
          counts.DELIVERED++;
          break;

        case 'CANCELLED':
          counts.CANCELLED++;
          break;

        case 'ASSIGNED':
        case 'IN_TRANSIT':
          counts.IN_PROGRESS++;
          break;
      }
    }

    this.statusCounts = counts;
  }

  initializeColumns(): void {
    this.columns = [
      { key: 'id', label: 'Order ID' },
      { key: 'user', label: 'Customer' },
      { key: 'amount', label: 'Amount' },
      {
        key: 'status',
        label: 'Status',
        template: this.statusTemplate,
      },
      {
        key: 'actions',
        label: '',
        template: this.actionsTemplate,
      },
    ];
  }

  // ===== Actions =====
  onEdit(order: any): void {
    console.log('Edit order:', order);
  }

  onDelete(order: any): void {
    this.selectedOrder = order;
    this.showConfirm = true;
  }

  onConfirmDelete(): void {
    console.log('Deleted:', this.selectedOrder);

    this.showConfirm = false;
    this.selectedOrder = null;

    this.loadOrders();
  }

  onCancelDelete(): void {
    this.showConfirm = false;
    this.selectedOrder = null;
  }

  onPageChange(page: number): void {
    this.page = page;
    this.applyFilters();
  }

  onSearchChange(search: string): void {
    this.searchTerm = search;
    this.page = 1;
    this.applyFilters();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.page = 1;
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DELIVERED':
        return 'delivered';

      case 'CANCELLED':
        return 'cancelled';

      case 'ASSIGNED':
      case 'IN_TRANSIT':
        return 'in-progress';

      case 'CREATED':
        return 'pending';

      default:
        return 'default';
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.limit) || 1;
  }
}
