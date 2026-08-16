import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminOrdersService } from '../../../admin/services/admin-orders.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnInit {
  orderId: string = '';
  order: any = null;
  loading: boolean = false;
  routeDistance: string = '';
  routeDuration: string = '';
  timelineSteps: { key: string; label: string; time: Date | null }[] = [];
  showCancelModal: boolean = false;
  selectedStatus: string = '';
  isUpdating: boolean = false;
  invoice: any = null;
  invoiceLoading = false;
  invoiceDownloading = false;
  invoiceEmailing = false;

  constructor(
    private route: ActivatedRoute,
    private ordersService: AdminOrdersService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';

    if (this.orderId) {
      this.fetchOrderDetails();
    }
  }

  fetchOrderDetails(): void {
    this.loading = true;

    this.ordersService.getOrderById(this.orderId).subscribe({
      next: (res: any) => {
        this.order = res?.data || null;

        if (this.order) {
          this.prepareTimeline();
          if (this.order.status === 'DELIVERED') this.loadInvoice();
        }

        this.loading = false;
      },
      error: (err: any) => {
        console.error('Order fetch failed', err);
        this.loading = false;
      },
    });
  }

  prepareTimeline(): void {
    const history = this.order?.statusHistory || [];

    const getTime = (status: string): Date | null => {
      const entry = history.find((h: any) => h.status === status);

      return entry?.timestamp ? new Date(entry.timestamp) : null;
    };

    this.timelineSteps = [
      {
        key: 'CREATED',
        label: 'Order Created',
        time: getTime('CREATED'),
      },
      {
        key: 'ASSIGNED',
        label: 'Assigned to Courier',
        time: getTime('ASSIGNED'),
      },
      {
        key: 'PICKED_UP',
        label: 'Picked Up',
        time: getTime('PICKED_UP'),
      },
      {
        key: 'IN_TRANSIT',
        label: 'In Transit',
        time: getTime('IN_TRANSIT'),
      },
      {
        key: 'DELIVERED',
        label: 'Delivered',
        time: getTime('DELIVERED'),
      },
    ];
  }

  goBack(): void {
    this.router.navigate(['/app/orders']);
  }

  onRouteInfo(data: any): void {
    this.routeDistance = data.distance;
    this.routeDuration = data.duration;
  }

  getEncodedMapUrl(address: string): string {
    if (!address) return '';
    return (
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(address)
    );
  }

  openInGoogleMaps(address: string): void {
    if (!address) return;

    const url =
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(address);

    window.location.href = url;
  }

  isStepActive(stepKey: string): boolean {
    const flow = [
      'CREATED',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
    ];
    const current = (this.order?.status || '').toUpperCase();

    const currentIndex = flow.indexOf(current);
    const stepIndex = flow.indexOf(stepKey);

    return stepIndex <= currentIndex;
  }

  cancelOrder(): void {
    if (
      this.order?.status === 'CANCELLED' ||
      this.order?.status === 'DELIVERED'
    ) {
      return;
    }

    this.showCancelModal = true;
  }

  confirmCancelOrder(): void {
    this.showCancelModal = false;

    this.ordersService.cancelOrder(this.orderId).subscribe({
      next: () => {
        this.fetchOrderDetails();
      },
      error: (err: any) => {
        console.error(err);
      },
    });
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  canMoveTo(nextStatus: string): boolean {
    const flow = [
      'CREATED',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
    ];
    const current = (this.order?.status || '').toUpperCase();

    const currentIndex = flow.indexOf(current);

    const nextIndex = flow.indexOf(nextStatus);
    if (currentIndex === -1) return false;
    return nextIndex === currentIndex + 1;
  }

  updateStatus(): void {
    if (!this.selectedStatus || !this.orderId) return;
    const status = this.selectedStatus.toUpperCase();
    this.isUpdating = true;

    this.ordersService.updateOrderStatus(this.orderId, status).subscribe({
      next: () => {
        this.fetchOrderDetails();

        this.selectedStatus = '';
        this.isUpdating = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isUpdating = false;
      },
    });
  }

  loadInvoice(): void {
    if (!this.orderId || this.invoiceLoading) return;
    this.invoiceLoading = true;
    this.ordersService.getInvoice(this.orderId).subscribe({
      next: (res: any) => {
        this.invoice = res?.data || null;
        this.invoiceLoading = false;
      },
      error: () => {
        this.invoice = null;
        this.invoiceLoading = false;
      },
    });
  }

  downloadInvoice(): void {
    if (!this.orderId || this.invoiceDownloading) return;
    this.invoiceDownloading = true;
    this.ordersService.downloadInvoice(this.orderId).subscribe({
      next: (response: any) => {
        const filename = this.invoiceFilename(response.headers?.get('Content-Disposition'));
        const url = URL.createObjectURL(response.body);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.invoiceDownloading = false;
      },
      error: () => {
        this.invoiceDownloading = false;
      },
    });
  }

  resendInvoiceEmail(): void {
    if (!this.orderId || this.invoiceEmailing) return;
    this.invoiceEmailing = true;
    this.ordersService.resendInvoiceEmail(this.orderId).subscribe({
      next: (res: any) => {
        this.invoice = res?.data || this.invoice;
        this.invoiceEmailing = false;
      },
      error: () => {
        this.invoiceEmailing = false;
      },
    });
  }

  private invoiceFilename(contentDisposition: string | null): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
    const safe = match?.[1]?.replace(/[^a-zA-Z0-9._-]/g, '-');
    return safe || 'MoveKart-Invoice.pdf';
  }
}
