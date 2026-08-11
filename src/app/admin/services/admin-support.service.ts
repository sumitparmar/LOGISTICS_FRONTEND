import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminSupportService {
  private baseUrl = `${environment.apiBaseUrl}/admin/support`;

  private ticketsSubject = new Subject<any>();
  tickets$ = this.ticketsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTickets(params?: any) {
    return this.http
      .get(`${this.baseUrl}/tickets`, { params })
      .pipe(tap((res) => this.ticketsSubject.next(res)));
  }

  fetchTicketsReactive(params: any): Observable<any> {
    return this.getTickets(params);
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
