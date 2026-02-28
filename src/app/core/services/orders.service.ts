import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private api: ApiService) {}

  getOrders() {
    return this.api.get('/orders');
  }

  getOrderById(id: string) {
    return this.api.get(`/orders/${id}`);
  }

  cancelOrder(id: string) {
    return this.api.post(`/orders/${id}/cancel`, {});
  }
}
