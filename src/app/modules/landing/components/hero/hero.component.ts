import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SecureInfoDialogComponent } from '../secure-info-dialog/secure-info-dialog.component';
import { PriceDialogComponent } from '../price-dialog/price-dialog.component';
import { PricingService } from '../../../../core/services/pricing.service';
declare var google: any;
@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  currency = 'INR';
  quoteForm!: FormGroup;
  loading = false;
  price: number | null = null;
  errorMessage = '';
  vehicles: { id: number; name: string; maxWeightKg: number }[] = [];
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChild('dropInput') dropInput!: ElementRef;
  private autocompleteInstances: any[] = [];
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private pricingService: PricingService,
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
      vehicleType: [null, Validators.required],
    });

    this.pricingService.getVehicles().subscribe({
      next: (response: any) => {
        this.vehicles = Array.isArray(response?.data) ? response.data : [];
        this.quoteForm.patchValue({
          vehicleType: this.vehicles[0]?.id || null,
        });
      },
      error: () => {
        this.errorMessage = 'Delivery options are temporarily unavailable. Please try again shortly.';
      },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (
        typeof google === 'undefined' ||
        !google.maps ||
        !google.maps.places?.Autocomplete
      ) {
        this.errorMessage = 'Location search is temporarily unavailable. You can still type the address.';
        return;
      }

      const pickupAutocomplete = new google.maps.places.Autocomplete(
        this.pickupInput.nativeElement,
        {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          types: ['geocode'],
        },
      );
      this.autocompleteInstances.push(pickupAutocomplete);

      pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        if (!place?.formatted_address && !place?.name) return;

        this.quoteForm.patchValue({
          pickup: place.formatted_address || place.name,
        });
      });

      const dropAutocomplete = new google.maps.places.Autocomplete(
        this.dropInput.nativeElement,
        {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          types: ['geocode'],
        },
      );
      this.autocompleteInstances.push(dropAutocomplete);

      dropAutocomplete.addListener('place_changed', () => {
        const place = dropAutocomplete.getPlace();
        if (!place?.formatted_address && !place?.name) return;

        this.quoteForm.patchValue({
          drop: place.formatted_address || place.name,
        });
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    if (typeof google === 'undefined' || !google.maps?.event) return;

    this.autocompleteInstances.forEach((instance) => {
      google.maps.event.clearInstanceListeners(instance);
    });
  }

  getQuote() {
    if (this.quoteForm.invalid) {
      this.quoteForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.price = null;
    this.errorMessage = '';
    const selected = Number(this.quoteForm.value.vehicleType);

    const payload: any = {
      matter: 'delivery',
      deliveryType: 'NOW',
      pickup: { address: this.quoteForm.value.pickup },
      drop: { address: this.quoteForm.value.drop },
      vehicleTypeId: selected,
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
