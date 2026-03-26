import {
  Component,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { Subject } from 'rxjs';

import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  AdminOrdersService,
  OrdersResponse,
} from '../../services/admin-orders.service';
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
  private searchSubject = new Subject<string>();
  searchTerm: string = '';
  selectedStatus: string = 'ALL';
  page: number = 1;
  limit: number = 7;
  private _backendTotal: number = 0;

  columns: any[] = [];
  orders: any[] = [];
  allOrders: any[] = [];
  loading: boolean = false;
  // filteredOrders: any[] = [];
  statusCounts: any = {
    ALL: 0,
    CREATED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    IN_PROGRESS: 0,
  };

  showConfirm = false;
  selectedOrder: any = null;

  constructor(
    private ordersService: AdminOrdersService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.initializeColumns();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((search: string) => {
        this.searchTerm = search;
        this.page = 1;
        this.loadOrders();
      });
  }

  onRowClick(order: any): void {
    if (!order?._id) return;

    this.router.navigate(['/admin/orders', order._id]);
  }
  loadOrders(): void {
    this.loading = true;
    this.ordersService
      .getOrders(this.page, this.limit, this.searchTerm, this.selectedStatus)
      .subscribe({
        next: (res: OrdersResponse) => {
          this.allOrders = res.data || [];

          this.orders = this.allOrders.map((o: any) => ({
            ...o,
            id: o.borzoOrderId || '-',
            user: o.customer?.name || '-',
            amount: `${o.pricing?.amount || 0} ${o.pricing?.currency || ''}`,
          }));

          this._backendTotal = res.pagination?.total || 0;

          if (res.statusCounts) {
            this.statusCounts = { ...res.statusCounts };
          }
          this.loading = false;
        },

        error: (err: any) => {
          console.error('Orders API failed:', err);
          this.orders = [];
          this.loading = false;
        },
      });
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
    this.loadOrders(); // not applyFilters
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search.trim());
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.page = 1;
    this.loadOrders();
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
    return Math.ceil(this._backendTotal / this.limit) || 1;
  }
}
