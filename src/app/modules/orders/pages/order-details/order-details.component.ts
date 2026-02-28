import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders.service';
@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
})
export class OrderDetailsComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.fetchOrder(this.orderId);
    }
  }

  fetchOrder(id: string): void {
    this.loading = true;
    this.ordersService.getOrderById(id).subscribe({
      next: (res: any) => {
        this.order = res.data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load order';
        this.loading = false;
      },
    });
  }
}
