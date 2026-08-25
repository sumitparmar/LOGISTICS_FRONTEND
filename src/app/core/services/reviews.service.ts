import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PublicReview {
  id: string;
  rating: number;
  comment: string;
  displayName: string;
  verifiedDelivery: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private api: ApiService) {}

  getPublicReviews(limit = 6): Observable<any> {
    return this.api.get('/reviews/public', { limit });
  }

  getOrderReview(orderId: string): Observable<any> {
    return this.api.get(`/reviews/order/${orderId}`);
  }

  dismissReviewPrompt(orderId: string): Observable<any> {
    return this.api.post(`/reviews/order/${orderId}/dismiss`, {});
  }

  getInvite(token: string): Observable<any> {
    return this.api.get(`/reviews/invite/${encodeURIComponent(token)}`);
  }

  submitInvite(token: string, payload: { rating: number; comment: string; displayName: string }): Observable<any> {
    return this.api.post(`/reviews/invite/${encodeURIComponent(token)}`, payload);
  }

  submitReview(payload: { orderId: string; rating: number; comment: string; displayName: string }): Observable<any> {
    return this.api.post('/reviews', payload);
  }
}
