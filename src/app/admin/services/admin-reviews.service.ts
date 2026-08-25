import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AdminReviewsService {
  constructor(private api: ApiService) {}
  getReviews(params: Record<string, string | number> = {}) { return this.api.get('/reviews/admin', params); }
  updateStatus(id: string, status: 'APPROVED' | 'REJECTED', moderationNote = '') { return this.api.patch(`/reviews/admin/${id}/status`, { status, moderationNote }); }
}
