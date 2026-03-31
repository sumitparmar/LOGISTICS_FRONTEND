import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminOrder } from './admin-orders.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersStore {
  private ordersSubject = new BehaviorSubject<AdminOrder[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  orders$: Observable<AdminOrder[]> = this.ordersSubject.asObservable();
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {}

  setOrders(orders: AdminOrder[]): void {
    this.ordersSubject.next(orders);
  }

  addOrder(order: AdminOrder): void {
    const current = this.ordersSubject.value;
    this.ordersSubject.next([order, ...current]);
  }

  updateOrder(updatedOrder: AdminOrder): void {
    const current = this.ordersSubject.value;

    const index = current.findIndex((o) => o._id === updatedOrder._id);

    let updated;

    if (index === -1) {
      // 🔥 ORDER NOT FOUND → ADD IT
      updated = [updatedOrder, ...current];
    } else {
      // 🔥 UPDATE EXISTING
      updated = current.map((order) =>
        order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order,
      );
    }

    this.ordersSubject.next(updated);
  }

  removeOrder(orderId: string): void {
    const current = this.ordersSubject.value;
    this.ordersSubject.next(current.filter((o) => o._id !== orderId));
  }

  setLoading(state: boolean): void {
    this.loadingSubject.next(state);
  }
}
