import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  revenue: number;
  usersChange: number;
  ordersChange: number;
  revenueChange: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  getStats(): Observable<AdminStats> {
    return of({
      totalUsers: 40689,
      totalOrders: 10293,
      revenue: 89000,
      usersChange: 8.5,
      ordersChange: 1.3,
      revenueChange: -4.3,
    });
  }
}
