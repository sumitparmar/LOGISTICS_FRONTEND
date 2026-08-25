import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AdminReviewsService } from '../../services/admin-reviews.service';
import { PermissionService } from '../../services/permission.service';
import { ToastService } from '../../services/toast.service';

type ReviewStatus = '' | 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({ selector: 'app-admin-reviews', templateUrl: './reviews.component.html', styleUrls: ['./reviews.component.scss'] })
export class ReviewsComponent implements OnInit {
  reviews: any[] = []; page = 1; limit = 20; total = 0; totalPages = 1;
  status: ReviewStatus = 'PENDING'; search = ''; loading = false; actionId: string | null = null; error = '';
  constructor(private reviewsService: AdminReviewsService, public permissionService: PermissionService, private toast: ToastService) {}
  ngOnInit(): void { this.loadReviews(); }
  loadReviews(): void {
    this.loading = true; this.error = '';
    const params: Record<string, string | number> = { page: this.page, limit: this.limit };
    if (this.status) params['status'] = this.status;
    if (this.search.trim().length >= 2) params['search'] = this.search.trim();
    this.reviewsService.getReviews(params).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (response: any) => { this.reviews = response?.data || []; const p = response?.pagination || {}; this.total = Number(p.total || 0); this.totalPages = Math.max(Number(p.totalPages || 1), 1); if (this.page > this.totalPages) { this.page = this.totalPages; this.loadReviews(); } },
      error: (error: any) => { this.error = error?.error?.message || 'Unable to load customer feedback'; },
    });
  }
  applyFilters(): void { this.page = 1; this.loadReviews(); }
  moderate(review: any, status: 'APPROVED' | 'REJECTED'): void {
    if (this.actionId) return; this.actionId = review._id;
    this.reviewsService.updateStatus(review._id, status).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: () => { this.toast.success(`Feedback ${status === 'APPROVED' ? 'approved' : 'rejected'}`); this.loadReviews(); },
      error: (error: any) => this.toast.error(error?.error?.message || 'Unable to update feedback'),
    });
  }
  onPageChange(page: number): void { if (page < 1 || page > this.totalPages || page === this.page) return; this.page = page; this.loadReviews(); }
  onLimitChange(limit: number): void { this.limit = limit; this.page = 1; this.loadReviews(); }
  stars(rating: number): number[] { return Array.from({ length: 5 }, (_, index) => index + 1).filter((star) => star <= rating); }
}
