import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface OrdersResponse {
  data: any[];
  meta?: {
    total: number;
    page?: number;
    limit?: number;
    stats?: {
      total: number;
      active: number;
      delivered: number;
      cancelled: number;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private api: ApiService) {}

  getOrders(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<OrdersResponse> {
    return this.api.get<OrdersResponse>('/orders/list', query);
  }

  getOrderById(id: string): Observable<any> {
    return this.api.get(`/orders/${id}`);
  }

  cancelOrder(id: string): Observable<any> {
    return this.api.post(`/orders/${id}/cancel`, {});
  }

  calculatePrice(payload: any): Observable<any> {
    return this.api.post('/orders/calculate', payload);
  }

  createOrder(payload: any): Observable<any> {
    return this.api.post('/orders/create', payload);
  }

  getPricingBreakdown(orderId: string): Observable<any> {
    return this.api.get(`/orders/${orderId}/pricing-breakdown`);
  }

  getCourier(orderId: string): Observable<any> {
    return this.api.get(`/orders/${orderId}/courier`);
  }

  getPOD(orderId: string): Observable<any> {
    return this.api.get(`/orders/${orderId}/pod`);
  }

  getDocuments(orderId: string): Observable<any> {
    return this.api.get(`/orders/${orderId}/documents`);
  }

  getProviderHistory(orderId: string): Observable<any> {
    return this.api.get(`/orders/${orderId}/history`);
  }

  getBankCards(): Observable<any> {
    return this.api.get('/borzo/bank-cards');
  }

  getDeliveryTypes(): Observable<any> {
    return this.api.get('/meta/delivery-types');
  }

  editOrder(orderId: string, payload: any): Observable<any> {
    return this.api.post(`/orders/${orderId}/edit`, payload);
  }
}
