import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
export interface Driver {
  id: number;
  name: string;
  phone: string;
  status: string;
  orderId: string;
}

export interface DriversResponse {
  data: Driver[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface DriverOnboardingResponse {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminDriversService {
  private baseUrl = `${environment.apiBaseUrl}/admin/couriers`;
  private onboardingUrl = `${environment.apiBaseUrl}/admin/driver-onboarding`;
  constructor(private http: HttpClient) {}

  getDrivers(
    page: number,
    limit: number,
    search: string,
  ): Observable<DriversResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<DriversResponse>(this.baseUrl, { params });
  }

  getOnboardingApplications(
    page = 1,
    limit = 10,
    search = '',
    status = 'ALL',
  ): Observable<DriverOnboardingResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('status', status);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<DriverOnboardingResponse>(this.onboardingUrl, {
      params,
    });
  }

  updateOnboardingStatus(
    id: string,
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    remarks = '',
  ): Observable<any> {
    return this.http.put(`${this.onboardingUrl}/${id}/status`, {
      status,
      remarks,
    });
  }
}
