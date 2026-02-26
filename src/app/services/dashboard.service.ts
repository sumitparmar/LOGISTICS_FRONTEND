import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary`);
  }
}
