import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SecureInfoDialogComponent } from '../secure-info-dialog/secure-info-dialog.component';
import { PriceDialogComponent } from '../price-dialog/price-dialog.component';
import { PricingService } from '../../../../core/services/pricing.service';
import { FOOTER_DATA } from '../../../../shared/components/footer/footer.config';
import { PublicReview, ReviewsService } from '../../../../core/services/reviews.service';
declare var google: any;

interface LocationSelection {
  lat: number;
  lng: number;
  address: string;
}

interface LandingFaq {
  question: string;
  answer: string;
}

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
  vehiclesLoading = true;
  activeFaqIndex: number | null = 0;
  locationPicker: 'pickup' | 'drop' | null = null;
  vehicles: { id: number; name: string; maxWeightKg: number }[] = [];
  publicReviews: PublicReview[] = [];
  reviewSummary = { count: 0, averageRating: 0 };
  reviewsLoading = true;
  reviewsUnavailable = false;
  readonly ratingScale = [1, 2, 3, 4, 5];
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChild('dropInput') dropInput!: ElementRef;
  private autocompleteInstances: any[] = [];

  readonly heroPoints = [
    { icon: 'local_shipping', label: 'Fast local and city delivery service' },
    { icon: 'inventory_2', label: 'Safe goods transport with verified partners' },
    { icon: 'bolt', label: 'Live quote calculation in seconds' },
  ];

  readonly features = [
    {
      icon: 'local_shipping',
      title: 'Fast Delivery Booking',
      description: 'Book an available delivery service with a live route quote.',
    },
    {
      icon: 'verified',
      title: 'Clear Order Handling',
      description: 'Review the route, package details and charges before you confirm.',
    },
    {
      icon: 'public',
      title: 'Live Service Catalog',
      description: 'Vehicle options and availability come from the connected delivery catalog.',
    },
  ];

  readonly steps = [
    {
      number: '01',
      title: 'Enter Pickup & Drop',
      description: 'Search an address, use your current location or choose the exact point on the map.',
    },
    {
      number: '02',
      title: 'Get Instant Price',
      description: 'Select an available vehicle and receive the live estimate for your route.',
    },
    {
      number: '03',
      title: 'Book & Track Live',
      description: 'Continue securely, create the order and follow its status from your account.',
    },
  ];

  readonly benefits = [
    { icon: 'verified', title: 'Verified Partner Flow', description: 'Partner applications and delivery operations follow a review-based workflow.' },
    { icon: 'schedule', title: 'Delivery Timing', description: 'Choose a supported delivery option during the booking flow.' },
    { icon: 'payments', title: 'Transparent Pricing', description: 'The quote is calculated from the selected route and service details.' },
    { icon: 'location_on', title: 'Route Visibility', description: 'Use the tracking flow to follow active orders after confirmation.' },
  ];

  readonly services = [
    'Delivery booking',
    'Same-day parcel delivery',
    'Business delivery workflows',
    'Live order tracking',
    'Route-based pricing',
    'Cash payment at delivery point',
  ];

  readonly cities = FOOTER_DATA.cities;

  readonly faqs: LandingFaq[] = [
    {
      question: 'How does delivery booking work?',
      answer: 'Enter pickup and drop locations, select an available service, calculate the live price and continue to secure booking.',
    },
    {
      question: 'Can I calculate a price without logging in?',
      answer: 'Yes. The public landing page can calculate a live estimate before login. Login is required only when you continue to create the order.',
    },
    {
      question: 'Can I choose a location on the map?',
      answer: 'Yes. Use the map action beside either address to search, use your current location or confirm the exact point on the official map.',
    },
    {
      question: 'How do I track my delivery?',
      answer: 'After the order is created, open Track Order from the navigation and use the order reference or your signed-in order flow.',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private router: Router,
    private dialog: MatDialog,
    private reviewsService: ReviewsService,
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
      pickupLat: [null],
      pickupLng: [null],
      dropLat: [null],
      dropLng: [null],
    });

    this.quoteForm.get('pickup')?.valueChanges.subscribe(() => {
      this.clearCoordinates('pickup');
      this.price = null;
    });

    this.quoteForm.get('drop')?.valueChanges.subscribe(() => {
      this.clearCoordinates('drop');
      this.price = null;
    });

    this.pricingService.getVehicles().subscribe({
      next: (response: any) => {
        this.vehiclesLoading = false;
        this.vehicles = Array.isArray(response?.data) ? response.data : [];
        this.quoteForm.patchValue({
          vehicleType: this.vehicles[0]?.id || null,
        });
      },
      error: () => {
        this.vehiclesLoading = false;
        this.errorMessage = 'Delivery options are temporarily unavailable. Please try again shortly.';
      },
    });

    this.loadPublicReviews();
  }

  private loadPublicReviews(): void {
    this.reviewsLoading = true;
    this.reviewsUnavailable = false;
    this.reviewsService.getPublicReviews(6).subscribe({
      next: (response: any) => {
        const data = response?.data || {};
        this.publicReviews = Array.isArray(data.reviews) ? data.reviews : [];
        this.reviewSummary = {
          count: Number(data.summary?.count || 0),
          averageRating: Number(data.summary?.averageRating || 0),
        };
        this.reviewsLoading = false;
      },
      error: () => {
        this.publicReviews = [];
        this.reviewSummary = { count: 0, averageRating: 0 };
        this.reviewsUnavailable = true;
        this.reviewsLoading = false;
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

        this.applyPlace('pickup', place);
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

        this.applyPlace('drop', place);
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
      pickup: this.getLocationPayload('pickup'),
      drop: this.getLocationPayload('drop'),
      vehicleTypeId: selected,
    };

    this.pricingService.calculatePrice(payload).subscribe({
      next: (res) => {
        const amount = res?.data?.amount || null;

        this.price = amount;
        this.currency = res?.data?.currency || 'INR';
        this.persistPendingDelivery();

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
    this.persistPendingDelivery();
    this.router.navigate(['/auth/login']);
  }

  private persistPendingDelivery(): void {
    const data = {
      pickup: this.quoteForm.value.pickup,
      drop: this.quoteForm.value.drop,
      vehicleType: this.quoteForm.value.vehicleType,
      price: this.price,
      pickupLat: this.quoteForm.value.pickupLat,
      pickupLng: this.quoteForm.value.pickupLng,
      dropLat: this.quoteForm.value.dropLat,
      dropLng: this.quoteForm.value.dropLng,
    };

    localStorage.setItem('PENDING_DELIVERY', JSON.stringify(data));
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

  goToDriverOnboarding(): void {
    this.router.navigate(['/become-courier/apply']);
  }

  openLocationPicker(field: 'pickup' | 'drop'): void {
    this.locationPicker = field;
  }

  closeLocationPicker(): void {
    this.locationPicker = null;
  }

  applyMapLocation(selection: LocationSelection): void {
    const field = this.locationPicker;
    if (!field) return;

    this.quoteForm.patchValue({ [field]: selection.address });
    this.setCoordinates(field, selection.lat, selection.lng);
    this.locationPicker = null;
  }

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  get vehicleAvailabilityText(): string {
    if (this.vehiclesLoading) return 'Loading live delivery options...';
    if (!this.vehicles.length) return 'Delivery options are unavailable right now.';
    return `${this.vehicles.length} live delivery option${this.vehicles.length === 1 ? '' : 's'} available`;
  }

  get vehicleAvailabilityStat(): string {
    return this.vehiclesLoading ? '...' : `${this.vehicles.length || '—'}`;
  }

  private applyPlace(field: 'pickup' | 'drop', place: any): void {
    const location = place?.geometry?.location;
    const address = place?.formatted_address || place?.name;
    if (!address) return;

    this.quoteForm.patchValue({ [field]: address });
    if (location) {
      this.setCoordinates(field, location.lat(), location.lng());
    }
  }

  private setCoordinates(field: 'pickup' | 'drop', lat: number, lng: number): void {
    this.quoteForm.patchValue(
      field === 'pickup'
        ? { pickupLat: lat, pickupLng: lng }
        : { dropLat: lat, dropLng: lng },
      { emitEvent: false },
    );
  }

  private clearCoordinates(field: 'pickup' | 'drop'): void {
    this.quoteForm.patchValue(
      field === 'pickup'
        ? { pickupLat: null, pickupLng: null }
        : { dropLat: null, dropLng: null },
      { emitEvent: false },
    );
  }

  private getLocationPayload(field: 'pickup' | 'drop'): any {
    const form = this.quoteForm.value;
    const location = {
      address: field === 'pickup' ? form.pickup : form.drop,
    };
    const lat = field === 'pickup' ? form.pickupLat : form.dropLat;
    const lng = field === 'pickup' ? form.pickupLng : form.dropLng;

    if (typeof lat === 'number' && typeof lng === 'number') {
      return { ...location, lat, lng };
    }

    return location;
  }
}
