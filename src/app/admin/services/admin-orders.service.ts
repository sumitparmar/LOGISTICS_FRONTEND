import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AdminOrder {
  borzoOrderId: string;
  customer: {
    name: string;
    phone: string;
  };
  pricing: {
    amount: number;
    currency: string;
  };
  status: string;
  provider: string;
  createdAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: AdminOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statusCounts: {
    ALL: number;
    CREATED: number;
    IN_PROGRESS: number;
    DELIVERED: number;
    CANCELLED: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersService {
  private apiUrl = 'http://localhost:5000/api/admin/orders';

  constructor(private http: HttpClient) {}

  getOrders(
    page: number = 1,
    limit: number = 5,
    search: string = '',
    status: string = 'ALL',
  ) {
    return this.http.get<OrdersResponse>(
      `${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`,
    );
  }

  getOrderById(id: string) {
    return this.http.get(`/api/admin/orders/${id}`);
  }
}
