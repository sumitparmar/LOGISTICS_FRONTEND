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
      serviceType: ['INSTANT', Validators.required],
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
  }

  calculate(): void {
    if (this.quoteForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.price = null;

    const service = this.quoteForm.value.serviceType;

    let payload: any = {
      matter: 'Parcel',
      pickup: { address: this.quoteForm.value.pickupAddress },
      drop: { address: this.quoteForm.value.dropAddress },
      vehicleTypeId: 8,
      deliveryType: 'STANDARD',
    };

    if (service === 'SAME_DAY') {
      payload.deliveryType = 'END_OF_DAY';
      delete payload.vehicleTypeId;
    }

    if (service === 'PRIORITY') {
      payload.deliveryType = 'STANDARD';
      payload.vehicleTypeId = 8;
      payload.priority = true;
    }

    if (service === 'INSTANT') {
      payload.deliveryType = 'STANDARD';
      payload.vehicleTypeId = 8;
    }

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

  bookDelivery(): void {
    this.router.navigate(['/auth/login']);
  }
}
