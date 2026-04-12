import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminOrdersService } from '../../../admin/services/admin-orders.service';
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

  constructor(
    private route: ActivatedRoute,
    private ordersService: AdminOrdersService,
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
    this.timelineSteps = [
      {
        key: 'CREATED',
        label: 'Order Created',
        time: this.order?.createdAt ? new Date(this.order.createdAt) : null,
      },
      {
        key: 'ASSIGNED',
        label: 'Assigned to Courier',
        time: this.order?.assignedAt ? new Date(this.order.assignedAt) : null,
      },
      {
        key: 'PICKED_UP',
        label: 'Picked Up',
        time: this.order?.pickedAt ? new Date(this.order.pickedAt) : null,
      },
      {
        key: 'DELIVERED',
        label: 'Delivered',
        time: this.order?.deliveredAt ? new Date(this.order.deliveredAt) : null,
      },
    ];
  }

  goBack(): void {
    window.history.back();
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

    window.open(url, '_blank');
  }

  isStepActive(stepKey: string): boolean {
    const flow = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'];

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
    const flow = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'];
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
}
