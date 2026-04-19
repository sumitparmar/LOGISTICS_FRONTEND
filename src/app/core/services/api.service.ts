import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${this.baseUrl}${cleanEndpoint}`;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = new HttpParams({
      fromObject: params || {},
    });

    return this.http.get<T>(this.buildUrl(endpoint), {
      params: httpParams,
    });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }
}
