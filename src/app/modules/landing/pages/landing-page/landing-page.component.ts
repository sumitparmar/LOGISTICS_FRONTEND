import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent implements OnInit {
  quoteForm!: FormGroup;
  loading = false;
  price: number | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.quoteForm = this.fb.group({
      matter: ['', Validators.required],
      pickupAddress: ['', Validators.required],
      dropAddress: ['', Validators.required],
    });
  }

  calculate() {
    if (this.quoteForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.price = null;

    const payload = {
      matter: this.quoteForm.value.matter,
      pickup: { address: this.quoteForm.value.pickupAddress },
      drop: { address: this.quoteForm.value.dropAddress },
    };

    this.api.post<any>('/orders/calculate', payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.price = res?.data?.pricing?.amount || null;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to calculate price';
      },
    });
  }

  bookDelivery() {
    this.router.navigate(['/auth/login']);
  }
}
