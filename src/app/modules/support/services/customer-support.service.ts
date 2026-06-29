import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/core/services/api.service';

export interface SupportTicketPayload {
  subject: string;
  message: string;
  category: string;
  priority: string;
  order?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerSupportService {
  constructor(private api: ApiService) {}

  getTickets(params?: any): Observable<any> {
    return this.api.get('/support/tickets', params);
  }

  getTicketById(id: string): Observable<any> {
    return this.api.get(`/support/tickets/${id}`);
  }

  createTicket(payload: SupportTicketPayload): Observable<any> {
    return this.api.post('/support/tickets', payload);
  }

  replyToTicket(id: string, message: string): Observable<any> {
    return this.api.post(`/support/tickets/${id}/reply`, { message });
  }

  markAsRead(id: string): Observable<any> {
    return this.api.patch(`/support/tickets/${id}/read`, {});
  }
}
