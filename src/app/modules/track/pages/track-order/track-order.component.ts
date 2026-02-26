import { Component } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';
import { OnInit } from '@angular/core';
@Component({
  selector: 'app-track-order',
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css'],
})
export class TrackOrderComponent implements OnInit {
  orderId = '';
  order: any = null;
  loading = false;
  error = '';

  vehicleMap: Record<number, string> = {};

  statusSteps: string[] = [
    'CREATED',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
  ];

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadVehicleCatalog();
  }
  loadVehicleCatalog() {
    this.api.get('/providers/vehicles').subscribe({
      next: (res: any) => {
        const vehicles = res?.data || [];
        this.vehicleMap = {};
        vehicles.forEach((v: any) => {
          this.vehicleMap[Number(v.id)] = v.name;
        });
      },
      error: (err) => {
        console.error('Failed to load vehicle catalog', err);
      },
    });
  }
  trackOrder() {
    if (!this.orderId?.trim()) {
      this.error = 'Please enter order ID';
      return;
    }

    this.loading = true;
    this.error = '';
    this.order = null;

    if (Object.keys(this.vehicleMap).length === 0) {
      this.loadVehicleCatalog();
    }

    this.api.get(`/orders/${this.orderId}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.order = res?.data;

        if (!this.order) {
          this.error = 'Order not found';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Unable to fetch order. Please try again.';
      },
    });
  }

  viewLiveTracking() {
    if (!this.order?._id) return;

    this.api.get(`/orders/${this.order._id}/tracking`).subscribe({
      next: (res: any) => {
        const url = res?.data?.tracking_url;

        if (url) {
          window.open(url, '_blank');
        } else {
          this.error = 'Tracking link not available yet';
        }
      },
      error: () => {
        this.error = 'Unable to fetch tracking link';
      },
    });
  }
  isStepDone(step: string): boolean {
    if (!this.order?.statusHistory?.length) return false;

    return this.order.statusHistory.some((s: any) => s.status === step);
  }
  cancel() {
    this.router.navigate(['/']);
  }
}
