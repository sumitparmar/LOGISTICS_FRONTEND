import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CustomerNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  meta?: Record<string, any>;

  order?: {
    _id: string;
    borzoOrderId?: string;
    status?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CustomerNotificationService {
  private API = `${environment.apiBaseUrl}/customer-notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<any> {
    return this.http.get(this.API);
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.API}/unread-count`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.API}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.API}/read-all`, {});
  }

  dismissFeedbackPrompt(orderId: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/reviews/order/${orderId}/dismiss`, {});
  }
}
