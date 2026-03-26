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
  constructor(
    private route: ActivatedRoute,
    private ordersService: AdminOrdersService,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';

    console.log('ORDER ID:', this.orderId);

    if (this.orderId) {
      this.fetchOrderDetails();
    }
  }

  // fetchOrderDetails(): void {
  //   this.loading = true;

  //   this.ordersService.getOrders(1, 100, '', 'ALL').subscribe({
  //     next: (res: any) => {
  //       console.log('FULL RESPONSE:', res);

  //       const list = res?.data || [];

  //       this.order =
  //         list.find((o: any) => String(o._id) === String(this.orderId)) ||
  //         list.find(
  //           (o: any) => String(o.borzoOrderId) === String(this.orderId),
  //         ) ||
  //         null;

  //       console.log('MATCHED ORDER:', this.order);

  //       this.loading = false;
  //     },
  //     error: (err: any) => {
  //       console.error('Order fetch failed', err);
  //       this.loading = false;
  //     },
  //   });
  // }

  fetchOrderDetails(): void {
    this.loading = true;

    this.ordersService.getOrderById(this.orderId).subscribe({
      next: (res: any) => {
        this.order = res?.data || null;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Order fetch failed', err);
        this.loading = false;
      },
    });
  }

  goBack(): void {
    window.history.back();
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
}
