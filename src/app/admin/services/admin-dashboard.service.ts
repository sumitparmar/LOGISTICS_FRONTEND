import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  revenue: number;
  usersChange: number;
  ordersChange: number;
  revenueChange: number;
  sales: { label: string; value: number }[];
  statusCounts: {
    CREATED: number;
    IN_PROGRESS: number;
    DELIVERED: number;
    CANCELLED: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private apiUrl = '/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  getStats(range: string): Observable<AdminStats> {
    return this.http
      .get<{
        success: boolean;
        data: AdminStats;
      }>(`${this.apiUrl}?range=${range}`)
      .pipe(map((res) => res.data));
  }
}
