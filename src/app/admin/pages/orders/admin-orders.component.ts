import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { AdminSocketService } from '../../services/admin-socket.service';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
    private adminSocket: AdminSocketService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.setupSearchDebounce();
    const status = this.route.snapshot.queryParamMap.get('status');

    if (status) {
      this.selectedStatus = status;
      this.page = 1;
    }

    this.loadOrders();

    this.adminSocket.connect();
    this.listenRealtime();
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

    let statusParam = this.selectedStatus;

    if (statusParam === 'ALL') {
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
          this.allOrders = res.data || [];

          this.orders = this.allOrders.map((o: any) => ({
            ...o,
            id: o.borzoOrderId || '-',
            user: o.customer?.name || '-',
            amount: `${o.pricing?.amount || 0} ${o.pricing?.currency || ''}`,
          }));

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

  // onConfirmDelete(): void {
  //   if (!this.selectedOrder?._id) return;

  //   this.ordersService.cancelOrder(this.selectedOrder._id).subscribe({
  //     next: () => {
  //       this.showConfirm = false;
  //       this.selectedOrder = null;
  //       this.loadOrders();
  //     },
  //     error: (err: any) => {
  //       console.error('Cancel failed:', err);
  //       this.showConfirm = false;
  //     },
  //   });
  // }

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

      this.isExporting = true;
      this.isExportingFromModal = true;

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

  exportCSV(): void {
    const data = this.getExportData();

    if (!data.length) {
      this.toastService.show('No data to export', 'warning');
      return;
    }

    try {
      const csv = this.convertToCSV(data);

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${new Date().toISOString()}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      this.toastService.show('CSV exported successfully', 'success');
    } catch (err) {
      console.error(err);
      this.toastService.show('Export failed', 'error');
    }
  }

  private getExportData(): any[] {
    const source =
      this.selectedOrders.size > 0
        ? this.allOrders.filter((o) => this.selectedOrders.has(o._id))
        : this.allOrders;

    return source.map((order) => ({
      Order_ID: order.borzoOrderId || '',
      Customer_Name: order.customer?.name || '',
      Phone: order.customer?.phone || '',
      Amount: order.pricing?.amount || 0,
      Status: order.status || '',
      Provider: order.provider || '',
      Created_At: new Date(order.createdAt).toISOString(),
    }));
  }

  private convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]);

    const escape = (value: any) => {
      if (value === null || value === undefined) return '';
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const rows = data.map((row) =>
      headers.map((field) => escape(row[field])).join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  exportAllCSV(): void {
    const statusParam =
      this.selectedStatus === 'ALL' ? '' : this.selectedStatus;

    this.ordersService
      .getOrders(
        1,
        10000,
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
          const allData = res.data || [];

          if (!allData.length) {
            this.toastService.show('No data to export', 'warning');
            this.isExporting = false;
            return;
          }

          const formatted = allData.map((order: any) => ({
            Order_ID: order.borzoOrderId || '',
            Customer_Name: order.customer?.name || '',
            Phone: order.customer?.phone || '',
            Amount: order.pricing?.amount || 0,
            Status: order.status || '',
            Provider: order.provider || '',
            Created_At: new Date(order.createdAt).toISOString(),
          }));

          const csv = this.convertToCSV(formatted);

          const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
          });

          const url = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = `orders_full_${new Date().toISOString()}.csv`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(url);

          this.toastService.show('Full export completed', 'success');
          setTimeout(() => {
            this.isExporting = false;
            this.isExportingFromModal = false;
            this.showConfirm = false;
          }, 600);
        },

        error: (err) => {
          console.error(err);
          this.toastService.show('Export failed', 'error');
          setTimeout(() => {
            this.isExporting = false;
            this.isExportingFromModal = false;
            this.showConfirm = false;
          }, 600);
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

  listenRealtime(): void {
    this.adminSocket.onOrderUpdate((update: any) => {
      console.log('ADMIN UPDATE:', update); // TEMP DEBUG
      this.handleRealtimeUpdate(update);
    });
  }

  handleRealtimeUpdate(update: any): void {
    const index = this.orders.findIndex((o) => o._id === update.orderId);

    if (index === -1) return;

    this.orders[index] = {
      ...this.orders[index],
      ...update.data,
      id: update.data.borzoOrderId || '-',
      user: update.data.customer?.name || '-',
      amount: `${update.data.pricing?.amount || 0} ${update.data.pricing?.currency || ''}`,
    };

    this.orders = [...this.orders];

    this.cdr.detectChanges();
  }
}
