import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminPricingService {
  private baseUrl = '/api/admin/pricing';

  constructor(private http: HttpClient) {}

  getPricing() {
    return this.http.get(this.baseUrl);
  }

  updatePricing(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  getAdminAnalytics() {
    return this.http.get('/api/admin/pricing/analytics');
  }
}
