import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
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
    private title: Title,
    private meta: Meta,
  ) {}

  ngOnInit(): void {
    this.setSeoTags();

    this.quoteForm = this.fb.group({
      matter: ['', Validators.required],
      pickupAddress: ['', Validators.required],
      dropAddress: ['', Validators.required],
    });
  }

  setSeoTags(): void {
    this.title.setTitle(
      'MoveKart | Logistics Company in India | Truck Booking & Delivery Service',
    );

    this.meta.updateTag({
      name: 'description',
      content:
        'MoveKart offers truck booking service, goods transport service, mini truck booking, pickup truck service and same-day delivery solutions across India.',
    });

    this.meta.updateTag({
      name: 'keywords',
      content:
        'logistics company in India, truck booking service, goods transport service, mini truck booking, pickup truck service, logistics services India, MoveKart',
    });

    this.meta.updateTag({
      property: 'og:title',
      content:
        'MoveKart | Fast & Affordable Logistics & Delivery Service in India',
    });

    this.meta.updateTag({
      property: 'og:description',
      content:
        'Book truck booking, goods transport and delivery solutions with MoveKart.',
    });

    this.meta.updateTag({
      property: 'og:type',
      content: 'website',
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
