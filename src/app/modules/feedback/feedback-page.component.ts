import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ReviewsService } from '../../core/services/reviews.service';

@Component({
  selector: 'app-feedback-page',
  templateUrl: './feedback-page.component.html',
  styleUrls: ['./feedback-page.component.scss'],
})
export class FeedbackPageComponent implements OnInit {
  readonly ratingScale = [1, 2, 3, 4, 5];
  form: FormGroup;
  token = '';
  invitation: any = null;
  loading = true;
  submitting = false;
  submitted = false;
  error = '';
  attempted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reviewsService: ReviewsService,
  ) {
    this.form = this.formBuilder.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.loading = false;
      this.error = 'This feedback link is incomplete.';
      return;
    }
    this.reviewsService.getInvite(this.token).subscribe({
      next: (response: any) => {
        this.invitation = response?.data || null;
        this.loading = false;
      },
      error: (response: any) => {
        this.loading = false;
        this.error = response?.error?.message || 'This feedback link is no longer available.';
      },
    });
  }

  setRating(rating: number): void {
    this.form.patchValue({ rating });
    this.form.get('rating')?.markAsTouched();
  }

  submit(): void {
    this.attempted = true;
    if (this.form.invalid || this.submitting || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';
    this.reviewsService.submitInvite(this.token, this.form.value).pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => (this.submitted = true),
      error: (response: any) => { this.error = response?.error?.message || 'Unable to submit feedback right now.'; },
    });
  }

  goHome(): void { this.router.navigate(['/']); }
}
