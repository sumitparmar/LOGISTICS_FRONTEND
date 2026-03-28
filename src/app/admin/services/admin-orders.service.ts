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

export interface BulkResponse {
  success: boolean;
  totalRequested: number;
  modifiedCount: number;
  failedIds: string[];
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
    sortBy?: string,
    sortOrder?: string,
  ) {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`;

    // ✅ ADD SORTING (SAFE)
    if (sortBy) {
      url += `&sortBy=${sortBy}`;
    }

    if (sortOrder) {
      url += `&sortOrder=${sortOrder}`;
    }

    return this.http.get<OrdersResponse>(url);
  }

  getOrderById(id: string) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateOrderStatus(orderId: string, status: string) {
    return this.http.put(`${this.apiUrl}/${orderId}/status`, { status });
  }

  cancelOrder(orderId: string) {
    return this.http.put(`${this.apiUrl}/${orderId}/cancel`, {});
  }

  bulkCancel(orderIds: string[]) {
    return this.http.put<BulkResponse>(`${this.apiUrl}/bulk/cancel`, {
      orderIds,
    });
  }

  bulkUpdateStatus(orderIds: string[], status: string) {
    return this.http.put<BulkResponse>(`${this.apiUrl}/bulk/status`, {
      orderIds,
      status,
    });
  }
}
