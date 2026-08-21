import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SUPPORTED_CUSTOMER_VEHICLE_IDS = new Set([8]);

function filterCustomerVehicles(response: any): any {
  const vehicles = Array.isArray(response?.data) ? response.data : [];
  const supportedVehicles = vehicles.filter((vehicle: any) =>
    SUPPORTED_CUSTOMER_VEHICLE_IDS.has(Number(vehicle.id)),
  );

  return {
    ...response,
    data: supportedVehicles.length
      ? supportedVehicles
      : [
          {
            id: 8,
            code: 'BIKE',
            name: 'Motorbike',
            maxWeightKg: 20,
          },
        ],
  };
}

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

  createOrder(payload: any, idempotencyKey?: string): Observable<any> {
    return this.api.post(
      '/orders/create',
      payload,
      idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    );
  }

  createPaymentIntent(payload: {
    amount: number;
    paymentMethod: 'UPI' | 'CARD' | 'QR' | 'NETBANKING' | 'WALLET';
    purpose?: 'ORDER_PAYMENT' | 'WALLET_TOPUP';
  }): Observable<any> {
    return this.api.post('/payments/intent', payload);
  }

  verifyPaymentIntent(
    intentId: string,
    payload: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ): Observable<any> {
    return this.api.post(`/payments/intent/${intentId}/verify`, payload);
  }

  getPaymentMethods(): Observable<any> {
    return this.api.get('/payments');
  }

  confirmMockPaymentIntent(intentId: string): Observable<any> {
    return this.api.post(`/payments/intent/${intentId}/mock-confirm`, {});
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

  getInvoice(orderId: string): Observable<any> {
    return this.api.get(`/invoices/${orderId}`);
  }

  downloadInvoice(orderId: string): Observable<any> {
    return this.api.downloadFile(`/invoices/${orderId}/download`);
  }

  resendInvoiceEmail(orderId: string): Observable<any> {
    return this.api.post(`/invoices/${orderId}/email`, {});
  }

  getProviderHistory(orderId: string): Observable<any> {
    return this.api.get(`/orders/${orderId}/history`);
  }

  getBankCards(): Observable<any> {
    return this.api.get('/orders/provider/bank-cards');
  }

  getDeliveryTypes(): Observable<any> {
    return this.api.get('/meta/delivery-types');
  }

  getVehicleCatalog(): Observable<any> {
    return this.api
      .get('/providers/vehicles')
      .pipe(map(filterCustomerVehicles));
  }

  editOrder(orderId: string, payload: any): Observable<any> {
    return this.api.post(`/orders/${orderId}/edit`, payload);
  }
}
