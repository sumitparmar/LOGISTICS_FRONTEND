import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AdminPaymentRecord {
  orderId: string;
  customer: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export interface AdminPaymentsResponse {
  success: boolean;
  data: AdminPaymentRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalCodOrders: number;
    pendingCollection: number;
    collectedAmount: number;
    refundQueue: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminPaymentsService {
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/payments`;

  constructor(private http: HttpClient) {}

  getPayments(
    page: number,
    limit: number,
    search: string,
    status: string,
    type: string,
    date: string,
    sortBy: string,
    sortOrder: string,
  ): Observable<AdminPaymentsResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (search) params = params.set('search', search);
    if (status !== 'All') params = params.set('status', status);
    if (type !== 'All') params = params.set('type', type);
    if (date) params = params.set('date', date);

    return this.http.get<AdminPaymentsResponse>(this.baseUrl, { params });
  }

  reconcilePayments() {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.baseUrl}/reconcile`,
      {},
    );
  }

  exportPayments(params: Record<string, string>) {
    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }
}
