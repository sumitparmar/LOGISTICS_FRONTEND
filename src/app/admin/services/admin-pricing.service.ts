import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminPricingService {
  private baseUrl = `${environment.apiBaseUrl}/admin/pricing`;

  constructor(private http: HttpClient) {}

  getPricing() {
    return this.http.get(this.baseUrl);
  }

  updatePricing(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  getAdminAnalytics(range: string = 'month') {
    return this.http.get(
      `${environment.apiBaseUrl}/analytics/admin/pricing/analytics?range=${range}`,
    );
  }
}
