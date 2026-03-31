import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { OrdersStore } from './admin-orders.store';

export interface DriverView {
  name: string;
  phone: string;
  orderId: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class DriversStore {
  constructor(private ordersStore: OrdersStore) {}

  drivers$ = this.ordersStore.orders$.pipe(
    map((orders: any[]) => {
      const mapByPhone = new Map<string, DriverView>();

      orders.forEach((o) => {
        const c = o?.courier;
        if (!c?.phone) return;

        mapByPhone.set(c.phone, {
          name: c.name || '-',
          phone: c.phone,
          orderId: o._id,
          status: o.status,
        });
      });

      return Array.from(mapByPhone.values());
    }),
  );
}
