import { Component, OnInit } from '@angular/core';
import { AdminSocketService } from '../services/admin-socket.service';
import { OrdersStore } from '../services/admin-orders.store';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  constructor(
    private socketService: AdminSocketService,
    private ordersStore: OrdersStore,
  ) {}

  ngOnInit(): void {
    this.socketService.orderUpdate$.subscribe((payload: any) => {
      console.log('🔥 LAYOUT RECEIVED:', payload);

      const order = payload?.data || payload;

      if (!order?._id) return;

      this.ordersStore.updateOrder(order);
    });
  }
}
