import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';

import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { OrdersService } from 'src/app/core/services/orders.service';

declare const google: any;

@Component({
  selector: 'app-create-delivery',
  templateUrl: './create-delivery.component.html',
  styleUrls: ['./create-delivery.component.scss'],
})
export class CreateDeliveryComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChildren('stopInput') stopInputs!: QueryList<ElementRef>;
  @ViewChild('routeMap') routeMap!: ElementRef;

  private map: any;
  private directionsService: any;
  private directionsRenderer: any;
  private stopInputSubscription: any;
  deliveryForm!: FormGroup;

  private stopAutocompleteInstances: any[] = [];

  isCalculatingPrice = false;
  isCreatingOrder = false;

  priceSummary = {
    deliveryFee: 0,
    insurance: 0,
    total: 0,
  };

  weightOptions = [1, 5, 10, 15, 20];

  packageCategories = [
    'Documents',
    'Clothes',
    'Groceries',
    'Medicine',
    'Food',
    'Parcel',
  ];

  deliverySpeedOptions = [
    {
      code: 'NOW',
      title: 'Deliver Now',
      description: 'Courier arrives immediately',
      icon: 'flash_on',
    },
    {
      code: 'EOD',
      title: 'By End of Day',
      description: 'Lower price delivery',
      icon: 'schedule',
    },
    {
      code: 'SCHEDULED',
      title: 'Schedule',
      description: 'Choose pickup time',
      icon: 'event',
    },
  ];

  vehicleOptions = [
    {
      id: 1,
      title: '2-Wheeler Courier',
      description: 'Delivery via bike or public transport',
      limit: 'Up to 20 kg',
      icon: 'two_wheeler',
    },
    {
      id: 2,
      title: 'Mini Truck',
      description: 'Medium parcel deliveries',
      limit: 'Up to 500 kg',
      icon: 'local_shipping',
    },
    {
      id: 3,
      title: 'Truck',
      description: 'Heavy shipment transport',
      limit: 'Up to 2000 kg',
      icon: 'airport_shuttle',
    },
  ];

  paymentOptions = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Online', value: 'ONLINE' },
  ];

  showReorderModal = false;

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
  ) {}

  ngOnDestroy(): void {
    if (this.stopInputSubscription) {
      this.stopInputSubscription.unsubscribe();
    }

    this.stopAutocompleteInstances = [];
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 300);
    this.initPickupAutocomplete();
    setTimeout(() => {
      this.attachStopAutocompletes();
    });

    this.stopInputSubscription = this.stopInputs.changes.subscribe(() => {
      this.attachStopAutocompletes();
    });
  }

  selectVehicle(vehicleId: number): void {
    this.deliveryForm.patchValue({
      vehicleTypeId: vehicleId,
    });

    const hadPrice = this.priceSummary.total > 0;

    this.resetPrice();

    if (hadPrice) {
      this.calculatePrice();
    }
  }

  initializeForm(): void {
    this.deliveryForm = this.fb.group({
      pickupAddress: ['', Validators.required],
      pickupLat: [null],
      pickupLng: [null],

      pickupName: ['', Validators.required],
      pickupPhone: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
      ],
      pickupNotes: [''],

      stops: this.fb.array([this.createStop()]),

      package: this.fb.group({
        weight: [1, Validators.required],
        category: ['Documents'],
        description: ['', Validators.required],
      }),

      deliveryType: ['NOW', Validators.required],
      paymentMethod: ['CASH', Validators.required],
      vehicleTypeId: [1, Validators.required],

      parcelValue: [0],
    });
  }

  get stops(): FormArray {
    return this.deliveryForm.get('stops') as FormArray;
  }

  createStop(): FormGroup {
    return this.fb.group({
      address: ['', Validators.required],
      lat: [null],
      lng: [null],
      name: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      notes: [''],
    });
  }

  addStop(): void {
    this.stops.push(this.createStop());

    this.resetPrice();

    setTimeout(() => this.attachStopAutocompletes(), 0);
  }

  removeStop(index: number): void {
    if (this.stops.length > 1) {
      this.stops.removeAt(index);
      this.stopAutocompleteInstances.splice(index, 1);

      this.resetPrice();

      if (this.directionsRenderer) {
        this.directionsRenderer.set('directions', null);
      }

      this.renderRoute();
    }
  }

  async calculatePrice(): Promise<void> {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      alert('Please fill all required fields before calculating price');
      return;
    }

    const form = this.deliveryForm.value;

    if (!form.pickupLat || !form.pickupLng) {
      alert('Please select pickup address from suggestions');
      return;
    }

    for (const stop of form.stops) {
      if (!stop.lat || !stop.lng) {
        alert('Please select delivery address from suggestions');
        return;
      }
    }

    this.isCalculatingPrice = true;

    try {
      const distance = await this.calculateRouteDistance();

      const payload = {
        matter: form.package.description,

        vehicleTypeId: form.vehicleTypeId,

        distance: distance,

        pickup: {
          address: form.pickupAddress,
        },

        drop: {
          address: form.stops[form.stops.length - 1].address,
        },
      };

      this.ordersService.calculatePrice(payload).subscribe({
        next: (res: any) => {
          const amount = res?.data?.amount || 0;

          this.priceSummary.deliveryFee = amount;
          this.priceSummary.insurance = 0;
          this.priceSummary.total = amount;

          this.isCalculatingPrice = false;
        },

        error: (err) => {
          console.error('Price calculation failed', err);
          this.isCalculatingPrice = false;
        },
      });
    } catch (error) {
      console.error('Distance calculation failed', error);
      this.isCalculatingPrice = false;
    }
  }

  createOrder(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    if (!this.priceSummary.total) {
      alert('Please calculate price first');
      return;
    }

    this.isCreatingOrder = true;
    const form = this.deliveryForm.value;

    const payload = {
      matter: form.package.description,

      vehicleTypeId: form.vehicleTypeId,

      deliveryType: form.deliveryType,

      customer: {
        name: form.pickupName,
        phone: form.pickupPhone,
      },

      pickup: {
        address: form.pickupAddress,
        lat: form.pickupLat,
        lng: form.pickupLng,
      },

      drop: {
        address: form.stops[form.stops.length - 1].address,
        lat: form.stops[form.stops.length - 1].lat,
        lng: form.stops[form.stops.length - 1].lng,
      },

      stops: [
        {
          type: 'PICKUP',
          address: form.pickupAddress,
          lat: form.pickupLat,
          lng: form.pickupLng,
          phone: form.pickupPhone,
          name: form.pickupName,
        },

        ...form.stops.map((stop: any) => ({
          type: 'DROP',
          address: stop.address,
          lat: stop.lat,
          lng: stop.lng,
          phone: stop.phone,
          name: stop.name,
        })),
      ],

      package: {
        weight: form.package.weight,
        category: form.package.category,
        description: form.package.description,
      },

      payment: {
        method: form.paymentMethod,
      },

      declaredValue: form.parcelValue || 0,
    };

    this.ordersService.createOrder(payload).subscribe({
      next: (res: any) => {
        console.log('Order created', res);

        alert('Order created successfully');

        this.isCreatingOrder = false;
      },

      error: (err) => {
        console.error('Order creation failed', err);
        this.isCreatingOrder = false;
      },
    });
  }

  selectPayment(type: string): void {
    this.deliveryForm.patchValue({
      paymentMethod: type,
    });

    this.resetPrice();
  }

  resetPrice(): void {
    this.priceSummary = {
      deliveryFee: 0,
      insurance: 0,
      total: 0,
    };
  }
  selectWeight(weight: number): void {
    this.deliveryForm.get('package.weight')?.setValue(weight);
  }
  selectDeliveryType(type: string): void {
    this.deliveryForm.patchValue({
      deliveryType: type,
    });

    this.resetPrice();
  }

  openReorderModal(): void {
    this.showReorderModal = true;
  }

  closeReorderModal(): void {
    this.showReorderModal = false;
  }

  /* -------------------------------
      GOOGLE AUTOCOMPLETE
  -------------------------------- */

  initPickupAutocomplete(): void {
    const autocomplete = new google.maps.places.Autocomplete(
      this.pickupInput.nativeElement,
      { types: ['geocode'] },
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      this.deliveryForm.patchValue({
        pickupAddress: place.formatted_address,
        pickupLat: lat,
        pickupLng: lng,
      });
      this.renderRoute();
    });
  }

  attachStopAutocompletes(): void {
    this.stopInputs.forEach((input, index) => {
      if (this.stopAutocompleteInstances[index]) {
        return;
      }
      const autocomplete = new google.maps.places.Autocomplete(
        input.nativeElement,
        { types: ['geocode'] },
      );

      this.stopAutocompleteInstances[index] = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const stopGroup = this.stops.at(index);

        stopGroup.patchValue({
          address: place.formatted_address,
          lat,
          lng,
        });
        this.renderRoute();
      });
    });
  }

  /* -------------------------------
      ROUTE DISTANCE CALCULATION
  -------------------------------- */

  async calculateRouteDistance(): Promise<number> {
    if (!this.directionsService) {
      throw new Error('Directions service not initialized');
    }
    const directionsService = this.directionsService;
    const form = this.deliveryForm.value;

    if (!form.pickupLat || !form.pickupLng) {
      throw new Error('Pickup coordinates missing');
    }

    for (const stop of form.stops) {
      if (!stop.lat || !stop.lng) {
        throw new Error('Stop coordinates missing');
      }
    }
    const origin = {
      lat: form.pickupLat,
      lng: form.pickupLng,
    };

    const destination = {
      lat: form.stops[form.stops.length - 1].lat,
      lng: form.stops[form.stops.length - 1].lng,
    };

    const waypoints = form.stops.slice(0, -1).map((stop: any) => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status !== 'OK') {
            reject(status);
            return;
          }

          let totalDistance = 0;

          result.routes[0].legs.forEach((leg: any) => {
            totalDistance += leg.distance.value;
          });

          resolve(totalDistance / 1000);
        },
      );
    });
  }

  initMap(): void {
    if (this.map) return;
    this.map = new google.maps.Map(this.routeMap.nativeElement, {
      zoom: 12,
      center: { lat: 20.5937, lng: 78.9629 },
    });

    this.directionsService = new google.maps.DirectionsService();

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#ff7a00',
        strokeWeight: 4,
      },
    });

    this.directionsRenderer.setMap(this.map);
  }

  renderRoute(): void {
    if (!this.map || !this.directionsService) return;

    const form = this.deliveryForm.value;

    if (!form.pickupLat || !form.pickupLng) return;
    if (!form.stops.length) return;

    const destinationStop = form.stops[form.stops.length - 1];

    if (!destinationStop.lat) return;

    const origin = {
      lat: form.pickupLat,
      lng: form.pickupLng,
    };

    const destination = {
      lat: destinationStop.lat,
      lng: destinationStop.lng,
    };

    const waypoints = form.stops.slice(0, -1).map((stop: any) => ({
      location: {
        lat: stop.lat,
        lng: stop.lng,
      },
      stopover: true,
    }));
    if (this.directionsRenderer) {
      this.directionsRenderer.set('directions', null);
    }
    this.directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);

          const bounds = result.routes[0].bounds;
          this.map.fitBounds(bounds);
        }
      },
    );
  }
}
