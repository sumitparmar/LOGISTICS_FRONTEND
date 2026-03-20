import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PricingService } from '../../core/services/pricing.service';
import { debounceTime } from 'rxjs/operators';
import { OnDestroy } from '@angular/core';
import { RouteService } from '../../core/services/route.service';
declare const google: any;
interface CalculatePayload {
  matter: string;
  vehicleTypeId: number;
  pickup: { address: string };
  drop: { address: string };
}
interface Vehicle {
  id: number;
  name: string;
  maxWeightKg: number;
}

interface PriceResult {
  amount: number;
}

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
})
export class PricingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChild('dropInput') dropInput!: ElementRef;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: any;
  private directionsRenderer: any;

  routeDistance: number | null = null;
  routeDuration: string | null = null;
  pricingForm!: FormGroup;
  private pickupAutocomplete: any;
  private dropAutocomplete: any;
  vehicles: Vehicle[] = [];

  selectedVehicle: Vehicle | null = null;

  priceResult: PriceResult | null = null;

  loading = false;

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private routeService: RouteService,
  ) {}

  ngAfterViewInit(): void {
    this.initAutocomplete();
    this.initMap();
  }

  ngOnInit(): void {
    this.initForm();

    this.loadVehicles();

    this.watchFormChanges();
  }

  initForm() {
    this.pricingForm = this.fb.group({
      pickup: ['', Validators.required],
      drop: ['', Validators.required],
      vehicleTypeId: ['', Validators.required],
      matter: ['parcel'],
    });
  }

  initMap() {
    if (!this.mapContainer) return;

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 12,
      center: { lat: 20.5937, lng: 78.9629 },
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: '#ff7a00',
        strokeWeight: 4,
      },
    });

    this.directionsRenderer.setMap(this.map);
  }

  async renderRoute() {
    const form = this.pricingForm.value;

    if (!form.pickup || !form.drop) return;

    if (!this.map) {
      this.initMap();
    }

    try {
      const result = await this.routeService.calculateRoute(
        form.pickup,
        form.drop,
      );

      this.directionsRenderer.setDirections(result);

      const leg = result.routes[0].legs[0];

      this.routeDistance = Math.round(leg.distance.value / 1000);
      this.routeDuration = leg.duration.text;

      this.map.fitBounds(result.routes[0].bounds);
    } catch (error) {
      console.error('Route calculation failed', error);

      this.routeDistance = null;
      this.routeDuration = null;

      if (this.directionsRenderer) {
        this.directionsRenderer.setDirections({ routes: [] });
      }
    }
  }

  initAutocomplete(): void {
    this.pickupAutocomplete = new google.maps.places.Autocomplete(
      this.pickupInput.nativeElement,
      { types: ['geocode'] },
    );

    this.pickupAutocomplete.addListener('place_changed', () => {
      const place = this.pickupAutocomplete.getPlace();
      if (!place.geometry) return;

      this.pricingForm.patchValue({
        pickup: place.formatted_address,
      });

      this.renderRoute();
    });

    this.dropAutocomplete = new google.maps.places.Autocomplete(
      this.dropInput.nativeElement,
      { types: ['geocode'] },
    );

    this.dropAutocomplete.addListener('place_changed', () => {
      const place = this.dropAutocomplete.getPlace();

      if (!place.geometry) return;

      this.pricingForm.patchValue({
        drop: place.formatted_address,
      });

      this.renderRoute();
    });
  }

  loadVehicles() {
    this.pricingService.getVehicles().subscribe({
      next: (res: any) => {
        this.vehicles = res?.data || [];
      },
      error: (err) => {
        console.error('Vehicle loading failed', err);
      },
    });
  }

  watchFormChanges() {
    this.pricingForm.get('pickup')?.valueChanges.subscribe(() => {
      this.priceResult = null;
      this.routeDistance = null;
      this.routeDuration = null;

      if (this.directionsRenderer) {
        this.directionsRenderer.setDirections({ routes: [] });
      }
    });

    this.pricingForm.get('drop')?.valueChanges.subscribe(() => {
      this.priceResult = null;
      this.routeDistance = null;
      this.routeDuration = null;

      if (this.directionsRenderer) {
        this.directionsRenderer.setDirections({ routes: [] });
      }
    });

    this.pricingForm
      .get('vehicleTypeId')
      ?.valueChanges.pipe(debounceTime(400))
      .subscribe(() => {
        const pickup = this.pricingForm.get('pickup')?.value;
        const drop = this.pricingForm.get('drop')?.value;

        if (!pickup || !drop) return;

        this.calculate();
      });
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.pricingForm.patchValue({ vehicleTypeId: vehicle.id });
  }

  calculate() {
    if (this.pricingForm.invalid) {
      this.pricingForm.markAllAsTouched();
      return;
    }

    if (this.loading) return;

    const form = this.pricingForm.value;

    if (form.pickup === form.drop) {
      this.routeDistance = null;
      this.routeDuration = null;
      this.priceResult = null;

      if (this.directionsRenderer) {
        this.directionsRenderer.setDirections({ routes: [] });
      }

      return;
    }

    this.selectedVehicle =
      this.vehicles.find((v) => v.id == form.vehicleTypeId) || null;

    const payload: CalculatePayload = {
      matter: form.matter,
      vehicleTypeId: form.vehicleTypeId,
      pickup: { address: form.pickup },
      drop: { address: form.drop },
    };

    this.loading = true;

    this.pricingService.calculatePrice(payload).subscribe({
      next: (res: any) => {
        this.priceResult = {
          amount: res?.data?.amount || 0,
        };

        this.loading = false;
      },

      error: (err) => {
        console.error('Price calculation failed', err);
        this.loading = false;
        this.priceResult = null;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }

    if (this.pickupAutocomplete) {
      google.maps.event.clearInstanceListeners(this.pickupAutocomplete);
    }

    if (this.dropAutocomplete) {
      google.maps.event.clearInstanceListeners(this.dropAutocomplete);
    }
  }
}
