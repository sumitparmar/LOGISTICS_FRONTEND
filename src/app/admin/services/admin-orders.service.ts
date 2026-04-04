import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
export interface AdminOrder {
  _id: string;
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
  private apiUrl = `${environment.apiBaseUrl}/admin/orders`;
  constructor(private http: HttpClient) {}

  getOrders(
    page: number = 1,
    limit: number = 5,
    search: string = '',
    status: string | string[] = '',
    sortBy?: string,
    sortOrder?: string,
    fromDate?: string,
    toDate?: string,
    provider?: string,
  ) {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search);

    //  FIX: append multiple status properly
    if (status) {
      if (Array.isArray(status)) {
        status.forEach((s) => {
          params = params.append('status', s);
        });
      } else if (status !== 'ALL') {
        params = params.set('status', status);
      }
    }

    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (provider) params = params.set('provider', provider);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortOrder) params = params.set('sortOrder', sortOrder);

    return this.http.get<OrdersResponse>(this.apiUrl, { params });
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

  exportCSV(params: any) {
    return this.http.get(`${environment.apiBaseUrl}/admin/export`, {
      params,
      responseType: 'blob',
    });
  }
}
