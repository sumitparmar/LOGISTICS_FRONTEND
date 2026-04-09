import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminSupportService {
  private baseUrl = 'http://localhost:5000/api/admin/support';

  constructor(private http: HttpClient) {}

  getTickets(params?: any) {
    return this.http.get(`${this.baseUrl}/tickets`, { params });
  }

  getTicketById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/tickets/${id}`);
  }

  replyToTicket(id: string, message: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/tickets/${id}/reply`, { message });
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/tickets/${id}/status`, { status });
  }

  getCounts() {
    return this.http.get(`${this.baseUrl}/tickets/count`);
  }
}
