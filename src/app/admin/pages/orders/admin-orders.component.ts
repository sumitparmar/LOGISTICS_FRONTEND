import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { OrdersStore } from '../../services/admin-orders.store';
import { NgZone } from '@angular/core';

import {
  AdminOrdersService,
  OrdersResponse,
} from '../../services/admin-orders.service';
@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss'],
})
export class AdminOrdersComponent implements OnInit {
  // ===== Templates =====
  @ViewChild('statusTemplate', { static: true })
  statusTemplate!: TemplateRef<any>;

  @ViewChild('actionsTemplate', { static: true })
  actionsTemplate!: TemplateRef<any>;

  @ViewChild('selectTemplate', { static: true })
  selectTemplate!: TemplateRef<any>;

  isBulkCancelling: boolean = false;
  isBulkUpdating: boolean = false;
  private searchSubject = new Subject<string>();
  searchTerm: string = '';
  selectedStatus: string = 'ALL';
  page: number = 1;
  limit: number = 7;
  private _backendTotal: number = 0;
  selectedOrders: Set<string> = new Set();
  columns: any[] = [];
  orders: any[] = [];
  allOrders: any[] = [];
  loading: boolean = false;

  isExportingFromModal: boolean = false;
  isExporting: boolean = false;

  fromDate: string = '';
  toDate: string = '';
  selectedProvider: string = '';
  private destroy$ = new Subject<void>();
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
  sortBy: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  confirmMode: 'single' | 'bulkCancel' | 'bulkStatus' | 'export' = 'single';
  bulkStatusValue: string = '';

  constructor(
    private ordersService: AdminOrdersService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private ordersStore: OrdersStore,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.setupSearchDebounce();
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: any) => {
        const status = params['status'];

        this.selectedStatus = status || 'ALL';
        this.page = 1;

        this.loadOrders();
      });

    this.ordersStore.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orders) => {
        this.orders = orders.map((o: any) => ({
          ...o,
          id: o.borzoOrderId || '-',
          user: o.customer?.name || '-',
          amount: `${o.pricing?.amount || 0} ${o.pricing?.currency || ''}`,
        }));

        this.cdr.detectChanges();
      });
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

  confirmExport(): void {
    this.confirmMode = 'export';
    this.showConfirm = true;
  }

  getConfirmMessage(): string {
    if (this.confirmMode === 'export') {
      return this.getExportPreviewMessage();
    }
    if (this.confirmMode === 'single') {
      return `Are you sure you want to cancel order ${this.selectedOrder?.id}?`;
    }

    if (this.confirmMode === 'bulkCancel') {
      return `Are you sure you want to cancel ${this.selectedOrders.size} selected orders?`;
    }

    if (this.confirmMode === 'bulkStatus') {
      return `Are you sure you want to update ${this.selectedOrders.size} orders to ${this.bulkStatusValue}?`;
    }

    return 'Are you sure?';
  }

  onRowClick(order: any): void {
    if (!order?._id) return;

    this.router.navigate(['/admin/orders', order._id]);
  }

  loadOrders(): void {
    this.loading = true;
    this.cdr.detectChanges();
    const status = this.mapStatusForBackend(this.selectedStatus);
    let statusParam: any = this.mapStatusForBackend(this.selectedStatus);

    if (statusParam === null) {
      statusParam = '';
    }

    this.ordersService
      .getOrders(
        this.page,
        this.limit,
        this.searchTerm,
        statusParam,
        this.sortBy,
        this.sortOrder,
        this.fromDate,
        this.toDate,
        this.selectedProvider,
      )

      .subscribe({
        next: (res: OrdersResponse) => {
          this.ordersStore.setOrders(res.data || []);
          this._backendTotal = res.pagination?.total || 0;

          this._backendTotal = res.pagination?.total || 0;

          if (res.statusCounts) {
            const counts = res.statusCounts;

            this.statusCounts = {
              ...counts,
              ALL:
                (counts.CREATED || 0) +
                (counts.IN_PROGRESS || 0) +
                (counts.DELIVERED || 0) +
                (counts.CANCELLED || 0),
            };
          }
          this.loading = false;
        },

        error: (err: any) => {
          console.error('Orders API failed:', err);
          this.showToast('Failed to load orders', 'error');
          this.orders = [];
          this.loading = false;
        },
      });
  }

  clearSelection(): void {
    this.selectedOrders.clear();
  }

  formatStatus(status: string): string {
    if (status === 'PICKED_UP') return 'Picked Up';
    if (status === 'IN_TRANSIT') return 'In Transit';
    return status;
  }

  initializeColumns(): void {
    this.columns = [
      {
        key: 'select',
        label: '',
        template: this.selectTemplate,
      },

      {
        key: 'id',
        label: 'Order ID',
        sortable: true,
      },

      {
        key: 'user',
        label: 'Customer',
        sortable: true,
      },

      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
      },

      {
        key: 'status',
        label: 'Status',
        template: this.statusTemplate,
        sortable: true,
      },

      {
        key: 'actions',
        label: '',
        template: this.actionsTemplate,
      },
    ];
  }

  onSort(columnKey: string): void {
    if (!columnKey) return;

    if (this.sortBy === columnKey) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = columnKey;
      this.sortOrder = 'asc';
    }

    this.page = 1;
    this.loadOrders();
  }

  // ===== Actions =====
  onEdit(order: any): void {
    if (!order?._id) return;

    this.router.navigate(['/admin/orders', order._id]);
  }

  onDelete(order: any): void {
    this.selectedOrder = order;
    this.confirmMode = 'single';
    this.showConfirm = true;
  }

  onConfirmDelete(): void {
    // SINGLE
    if (this.confirmMode === 'single' && this.selectedOrder?._id) {
      this.ordersService.cancelOrder(this.selectedOrder._id).subscribe({
        next: () => {
          this.showToast('Order cancelled successfully', 'success');
          this.resetConfirmState();
          this.loadOrders();
        },
        error: () => {
          this.showToast('Cancel failed', 'error');
          this.resetConfirmState();
        },
      });
    }

    // BULK CANCEL
    else if (this.confirmMode === 'bulkCancel') {
      this.isBulkCancelling = true;
      this.ordersService.bulkCancel([...this.selectedOrders]).subscribe({
        next: () => {
          this.showToast('Orders cancelled successfully', 'success');
          this.selectedOrders.clear();
          this.resetConfirmState();
          this.loadOrders();
          this.isBulkCancelling = false;
        },
        error: () => {
          this.showToast('Bulk cancel failed', 'error');
          this.isBulkCancelling = false;
          this.resetConfirmState();
        },
      });
    }

    // BULK STATUS
    else if (this.confirmMode === 'bulkStatus') {
      this.isBulkUpdating = true;
      this.ordersService
        .bulkUpdateStatus([...this.selectedOrders], this.bulkStatusValue)
        .subscribe({
          next: (res: any) => {
            if (res.modifiedCount === 0) {
              this.showToast('No orders updated', 'warning');
            } else if (res.failedIds?.length) {
              this.showToast(
                `${res.modifiedCount} updated, ${res.failedIds.length} failed`,
                'warning',
              );
            } else {
              this.showToast('Bulk status updated successfully', 'success');
            }

            this.selectedOrders.clear();
            this.resetConfirmState();
            this.loadOrders();
            this.isBulkUpdating = false;
          },
          error: () => {
            this.showToast('Bulk update failed', 'error');
            this.isBulkUpdating = false;
            this.resetConfirmState();
          },
        });
    } else if (this.confirmMode === 'export') {
      if (this.isExporting) return;

      this.exportAllCSV();
    }
  }

  resetConfirmState() {
    this.showConfirm = false;
    this.selectedOrder = null;
    this.confirmMode = 'single';
    this.bulkStatusValue = '';
  }

  onCancelDelete(): void {
    this.resetConfirmState();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadOrders();
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search.trim());
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.page = 1;
    // this.selectedOrders.clear();
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

  mapStatusForBackend(status: string): any {
    if (status === 'ALL') return null;

    if (status === 'IN_PROGRESS') {
      return ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
    }

    return status;
  }

  toggleSelection(order: any): void {
    if (!order?._id) return;

    if (this.selectedOrders.has(order._id)) {
      this.selectedOrders.delete(order._id);
    } else {
      this.selectedOrders.add(order._id);
    }
  }

  toggleSelectAll(): void {
    const selectable = this.orders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED',
    );

    const allSelected = selectable.every((o) => this.selectedOrders.has(o._id));

    if (allSelected) {
      selectable.forEach((o) => this.selectedOrders.delete(o._id));
    } else {
      selectable.forEach((o) => this.selectedOrders.add(o._id));
    }
  }

  isAllSelectableChecked(): boolean {
    const selectable = this.orders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED',
    );

    return (
      selectable.length > 0 &&
      selectable.every((o) => this.selectedOrders.has(o._id))
    );
  }

  // bulkCancel(): void {
  //   if (!this.selectedOrders.size || this.isBulkLoading) return;

  //   this.isBulkLoading = true;

  //   this.ordersService.bulkCancel([...this.selectedOrders]).subscribe({
  //     next: (res: any) => {
  //       this.showToast('Orders cancelled successfully', 'success');
  //       this.selectedOrders.clear();
  //       this.loadOrders();
  //       this.isBulkLoading = false;
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.showToast('Bulk cancel failed', 'error');
  //       this.isBulkLoading = false;
  //     },
  //   });
  // }

  bulkCancel(): void {
    if (!this.selectedOrders.size || this.isBulkCancelling) {
      this.showToast('Select at least one order', 'warning');
      return;
    }

    this.confirmMode = 'bulkCancel';
    this.showConfirm = true;
  }

  // onBulkStatusChange(status: string, selectEl?: HTMLSelectElement): void {
  //   if (status === '') return;
  //   if (!status || !this.selectedOrders.size || this.isBulkLoading) return;

  //   this.isBulkLoading = true;

  //   this.ordersService
  //     .bulkUpdateStatus([...this.selectedOrders], status)
  //     .subscribe({
  //       next: (res: any) => {
  //         if (res.modifiedCount === 0) {
  //           this.showToast('No orders updated', 'warning');
  //         } else if (res.failedIds?.length) {
  //           this.showToast(
  //             `${res.modifiedCount} updated, ${res.failedIds.length} failed`,
  //             'warning',
  //           );
  //         } else {
  //           this.showToast('Bulk status updated successfully', 'success');
  //         }

  //         this.selectedOrders.clear();
  //         this.loadOrders();
  //         if (selectEl) selectEl.value = '';
  //         this.isBulkLoading = false;
  //       },
  //       error: (err) => {
  //         console.error(err);
  //         this.showToast('Bulk update failed', 'error');
  //         this.isBulkLoading = false;
  //       },
  //     });
  // }

  onBulkStatusChange(status: string, selectEl?: HTMLSelectElement): void {
    if (status === '') return;
    if (!status || !this.selectedOrders.size || this.isBulkUpdating) return;

    this.confirmMode = 'bulkStatus';
    this.bulkStatusValue = status;
    this.showConfirm = true;

    if (selectEl) selectEl.value = '';
  }

  showToast(message: string, type: 'success' | 'error' | 'warning') {
    this.toastService.show(message, type);
  }

  exportAllCSV(): void {
    this.isExporting = true;

    const statusParam =
      this.selectedStatus === 'ALL' ? '' : this.selectedStatus;

    const params: any = {
      type: 'orders',
      search: this.searchTerm || '',
      status: statusParam || '',
      fromDate: this.fromDate || '',
      toDate: this.toDate || '',
      provider: this.selectedProvider || '',
    };

    this.ordersService.exportCSV(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders-export.csv';
        a.click();

        window.URL.revokeObjectURL(url);
        this.ngZone.run(() => {
          this.isExporting = false;
          this.showConfirm = false;
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isExporting = false;
          this.showConfirm = false;
        });
      },
    });
  }

  getExportPreviewMessage(): string {
    const isSelected = this.selectedOrders.size > 0;
    const total = this._backendTotal || 0;

    if (isSelected) {
      return `Export ${this.selectedOrders.size} selected orders?`;
    }

    if (total > 1000) {
      return `Export ${total} orders? This may take a few seconds.`;
    }

    return `Export ${total} orders?`;
  }

  onFilterChange(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.toastService.show('Invalid date range', 'warning');
      return;
    }

    this.page = 1;
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
