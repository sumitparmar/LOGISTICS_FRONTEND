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

@Injectable({
  providedIn: 'root',
})
export class AdminDriversService {
  private baseUrl = `${environment.apiBaseUrl}/admin/couriers`;
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
}
