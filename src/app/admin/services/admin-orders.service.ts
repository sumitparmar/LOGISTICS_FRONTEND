import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersService {
  private apiUrl = 'http://localhost:5000/api/admin/orders';

  constructor(private http: HttpClient) {}

  getOrders() {
    return this.http.get(this.apiUrl);
  }
}
