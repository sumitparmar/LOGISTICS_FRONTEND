import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SecureInfoDialogComponent } from '../secure-info-dialog/secure-info-dialog.component';
import { PriceDialogComponent } from '../price-dialog/price-dialog.component';
declare var google: any;
@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit, AfterViewInit {
  currency = 'INR';
  quoteForm!: FormGroup;
  loading = false;
  price: number | null = null;
  errorMessage = '';
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChild('dropInput') dropInput!: ElementRef;
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  // ngOnInit(): void {
  //   this.quoteForm = this.fb.group({
  //     pickup: ['', Validators.required],
  //     drop: ['', Validators.required],
  //     vehicleType: ['', Validators.required],
  //   });
  // }
  ngOnInit(): void {
    this.quoteForm = this.fb.group({
      pickup: ['', Validators.required],
      drop: ['', Validators.required],
      vehicleType: [8, Validators.required],
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof google === 'undefined') {
        console.error('Google Maps not loaded');
        return;
      }

      const pickupAutocomplete = new google.maps.places.Autocomplete(
        this.pickupInput.nativeElement,
      );

      pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        this.quoteForm.patchValue({
          pickup: place.formatted_address,
        });
      });

      const dropAutocomplete = new google.maps.places.Autocomplete(
        this.dropInput.nativeElement,
      );

      dropAutocomplete.addListener('place_changed', () => {
        const place = dropAutocomplete.getPlace();
        this.quoteForm.patchValue({
          drop: place.formatted_address,
        });
      });
    }, 1000);
  }

  getQuote() {
    if (this.quoteForm.invalid) {
      this.quoteForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.price = null;
    this.errorMessage = '';

    const payload = {
      matter: 'delivery',
      vehicleTypeId: this.quoteForm.value.vehicleType,
      pickup: { address: this.quoteForm.value.pickup },
      drop: { address: this.quoteForm.value.drop },
    };

    this.api.post<any>('/orders/calculate', payload).subscribe({
      next: (res) => {
        const amount = res?.data?.amount || null;

        this.price = amount;
        this.currency = res?.data?.currency || 'INR';

        this.dialog.open(PriceDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          panelClass: 'premium-price-dialog',
          data: { amount },
        });

        this.loading = false;
      },

      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to calculate quote';
      },
    });
  }

  bookDelivery() {
    if (!this.price) {
      this.errorMessage = 'Please check price first.';
      return;
    }
    const data = {
      pickup: this.quoteForm.value.pickup,
      drop: this.quoteForm.value.drop,
      vehicleType: this.quoteForm.value.vehicleType,
      price: this.price,
    };

    // ✅ Save temporarily
    localStorage.setItem('PENDING_DELIVERY', JSON.stringify(data));

    this.router.navigate(['/auth/login']);
  }

  scrollToBooking() {
    const section = document.getElementById('booking-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openSecureInfo(): void {
    const dialogRef = this.dialog.open(SecureInfoDialogComponent, {
      width: '430px',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'secure-info-modal',
      backdropClass: 'secure-info-backdrop',
    });

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('cdk-global-scrollblock');
    });
  }

  goToTracking() {
    this.router.navigate(['/track']);
  }
}
