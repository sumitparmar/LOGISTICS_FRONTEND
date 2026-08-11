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
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersService } from 'src/app/core/services/orders.service';
import { RouteService } from 'src/app/core/services/route.service';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { AddressService } from 'src/app/core/services/address.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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
  deliveryTypesConfig: any = {};
  deliverySpeedOptions: any[] = [];
  savedAddresses: any[] = [];
  selectedScheduleTime: string | null = null;
  private toastTimer: any;
  hasLastDelivery = false;
  mode: string | null = null;
  private modeSub: any;
  showToast = false;
  toastMessage = '';
  private directionsRenderer: any;
  private pickupMarker: any = null;
  private dropMarker: any = null;
  isFetchingCurrentLocation = false;
  currentLocationSuccess = false;
  private currentLocationRetryCount = 0;
  private geocoder: any;
  private stopInputSubscription: any;
  private formSubscriptions: any[] = [];
  deliveryForm!: FormGroup;
  bankCards: any[] = [];
  private stopAutocompleteInstances: any[] = [];
  isPaymentProcessing = false;
  paymentCompleted = false;
  isCalculatingPrice = false;
  isCreatingOrder = false;
  insuranceCharge: number = 0;
  priceSummary = {
    deliveryFee: 0,
    insurance: 0,
    taxableAmount: 0,
    gstRate: 0,
    gstAmount: 0,
    total: 0,
  };
  currentStep = 1;

  private themeColor(token: string, fallback: string): string {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
      fallback
    );
  }

  weightOptions = [1, 5, 10, 20, 50, 100, 250, 500, 750, 1000];
  packageCategories = [
    'Documents',
    'Clothes',
    'Groceries',
    'Medicine',
    'Food',
    'Parcel',
  ];

  vehicleOptions = [
    {
      id: 1,
      title: 'Mini 3-Wheeler',
      description: 'Small vehicle for medium parcels',
      limit: 'Up to 100 kg',
      icon: 'local_shipping',
    },

    {
      id: 2,
      title: 'Tempo Truck',
      description: 'Large scale cargo delivery',
      limit: 'Up to 200 kg',
      icon: 'local_shipping',
    },

    {
      id: 3,
      title: 'Tata Ace 7ft',
      description: 'Heavy shipment transport',
      limit: 'Up to 750 kg',
      icon: 'airport_shuttle',
    },

    {
      id: 5,
      title: 'Tata Ace 8ft',
      description: 'Medium cargo deliveries',
      limit: 'Up to 1000 kg',
      icon: 'airport_shuttle',
    },

    {
      id: 8,
      title: 'Motorbike',
      description: 'Fast delivery via bike',
      limit: 'Up to 20 kg',
      icon: 'two_wheeler',
    },
  ];

  paymentOptions = [{ label: 'Advance Payment', value: 'BALANCE' }];
  paymentIntentId: string | null = null;

  showReorderModal = false;
  showPickupLocationPicker = false;
  showDeliveryLocationPicker = false;
  deliveryStopIndex = 0;
  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private router: Router,
    private routeService: RouteService,
    private analytics: AnalyticsService,
    private authService: AuthService,
    private addressService: AddressService,
  ) {}

  ngOnDestroy(): void {
    if (this.stopInputSubscription) {
      this.stopInputSubscription.unsubscribe();
    }

    this.stopAutocompleteInstances.forEach((instance) => {
      if (instance && this.isGoogleMapsReady() && google.maps?.event) {
        google.maps.event.clearInstanceListeners(instance);
      }
    });

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }
    if (this.modeSub) {
      this.modeSub.unsubscribe();
    }
    this.formSubscriptions.forEach((sub) => sub?.unsubscribe?.());
    this.stopAutocompleteInstances = [];

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }

  private isGoogleMapsReady(): boolean {
    return typeof google !== 'undefined' && !!google.maps;
  }

  private getGeolocationErrorMessage(error: any): string {
    if (!error || typeof error.code !== 'number') {
      return 'Unable to determine your current location. Please check browser location access.';
    }

    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission is blocked. Allow location access in your browser and try again.';
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
      return 'Current location is unavailable on this device. Please select the pickup on map.';
    }

    if (error.code === error.TIMEOUT) {
      return 'Location request timed out. Please try again or choose pickup on map.';
    }

    return 'Unable to determine your current location. Please try again or choose pickup on map.';
  }

  useCurrentPickupLocation(): void {
    this.isFetchingCurrentLocation = true;
    this.currentLocationRetryCount = 0;

    if (!navigator.geolocation) {
      this.isFetchingCurrentLocation = false;

      this.showToastMessage('Geolocation is not supported on this device.');

      return;
    }

    (async () => {
      try {
        let position = await this.getCurrentPosition();

        console.log('Location accuracy:', position.coords.accuracy);

        if (
          position.coords.accuracy > 75 &&
          this.currentLocationRetryCount < 1
        ) {
          this.currentLocationRetryCount++;

          this.showToastMessage('Improving location accuracy...');

          await new Promise((resolve) => setTimeout(resolve, 1500));

          position = await this.getCurrentPosition();

          console.log('Retry accuracy:', position.coords.accuracy);
        }

        const accuracy = position.coords.accuracy;

        console.log(
          'Latitude:',
          position.coords.latitude,
          'Longitude:',
          position.coords.longitude,
          'Accuracy:',
          accuracy,
        );

        if (accuracy > 250) {
          this.isFetchingCurrentLocation = false;

          this.showToastMessage(
            `Couldn't get an accurate GPS location (${Math.round(accuracy)}m). Please try again from an open area.`,
          );

          return;
        }

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.deliveryForm.patchValue({
          pickupLat: lat,
          pickupLng: lng,
        });

        if (this.isGoogleMapsReady() && !this.map) {
          this.initMap();
        }

        if (this.map && google.maps?.LatLng) {
          const location = new google.maps.LatLng(lat, lng);
          this.map.panTo(location);
          this.map.setZoom(17);
        }

        if (!this.geocoder) {
          this.isFetchingCurrentLocation = false;
          this.resetPrice();
          this.currentLocationSuccess = true;
          this.showToastMessage(
            'Location detected. Google Maps is not configured, so please enter or choose the pickup address.',
          );
          setTimeout(() => {
            this.currentLocationSuccess = false;
          }, 1800);
          return;
        }

        this.resolvePickupAddressFromCoordinates(lat, lng);
      } catch (error) {
        this.isFetchingCurrentLocation = false;
        this.showToastMessage(this.getGeolocationErrorMessage(error));
        console.error(error);
      }
    })();
  }

  private resolvePickupAddressFromCoordinates(lat: number, lng: number): void {
    this.geocoder.geocode(
      {
        location: {
          lat,
          lng,
        },
      },
      (results: any, status: any) => {
        this.isFetchingCurrentLocation = false;

        if (status === 'OK' && results.length) {
          this.deliveryForm.patchValue({
            pickupAddress: results[0].formatted_address,
          });

          this.renderRoute();
          this.resetPrice();
          this.currentLocationSuccess = true;
          this.showToastMessage('Current location detected successfully.');

          setTimeout(() => {
            this.currentLocationSuccess = false;
          }, 1800);
          return;
        }

        this.resetPrice();
        this.showToastMessage(
          'Location detected, but address lookup failed. Please confirm pickup on map.',
        );
      },
    );
  }

  // openPickupLocationPicker(): void {
  //   this.showPickupLocationPicker = true;
  // }

  openPickupLocationPicker(): void {
    if (!this.isGoogleMapsReady()) {
      this.showToastMessage(
        'Google Maps is not configured. Please enter the pickup address manually.',
      );
      return;
    }

    this.showPickupLocationPicker = true;
  }

  openDeliveryLocationPicker(index: number): void {
    if (!this.isGoogleMapsReady()) {
      this.showToastMessage(
        'Google Maps is not configured. Please enter the delivery address manually.',
      );
      return;
    }

    this.deliveryStopIndex = index;
    this.showDeliveryLocationPicker = true;
  }

  closePickupLocationPicker(): void {
    this.showPickupLocationPicker = false;
  }

  closeDeliveryLocationPicker(): void {
    this.showDeliveryLocationPicker = false;
  }

  onPickupLocationSelected(event: {
    lat: number;
    lng: number;
    address: string;
  }): void {
    this.deliveryForm.patchValue({
      pickupAddress: event.address,
      pickupLat: event.lat,
      pickupLng: event.lng,
    });

    this.showPickupLocationPicker = false;

    this.resetPrice();
    this.renderRoute();
  }

  onDeliveryLocationSelected(event: {
    lat: number;
    lng: number;
    address: string;
  }): void {
    const stop = this.stops.at(this.deliveryStopIndex);

    stop.patchValue({
      address: event.address,
      lat: event.lat,
      lng: event.lng,
    });

    this.stopInputs.toArray()[this.deliveryStopIndex].nativeElement.value =
      event.address;
    this.showDeliveryLocationPicker = false;

    this.resetPrice();
    this.renderRoute();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadSavedAddresses();
    this.loadDeliveryTypes();
    this.loadVehicleOptions();
    this.hasLastDelivery = !!localStorage.getItem('LAST_DELIVERY');
    // this.loadLastDelivery();
    this.modeSub = this.authService.deliveryMode$.subscribe((mode) => {
      this.mode = mode;
      this.applyModeDefaults(mode);
    });

    this.formSubscriptions.push(
      this.deliveryForm.valueChanges.pipe(debounceTime(600)).subscribe(() => {
        if (!this.canAutoCalculate()) return;

        this.resetPrice();
        this.calculatePrice();
      }),
    );

    this.formSubscriptions.push(
      this.deliveryForm.get('package.weight')?.valueChanges.subscribe(() => {
        this.resetPrice();
      }),
    );

    this.formSubscriptions.push(
      this.deliveryForm
        .get('package.description')
        ?.valueChanges.subscribe(() => {
          this.resetPrice();
        }),
    );
    this.formSubscriptions.push(
      this.deliveryForm
        .get('pickupAddress')
        ?.valueChanges.subscribe((value) => {
          // Sirf manually typing par coordinates clear karo
          if (
            value &&
            value !== this.deliveryForm.get('pickupAddress')?.value
          ) {
            this.deliveryForm.patchValue(
              {
                pickupLat: null,
                pickupLng: null,
              },
              { emitEvent: false },
            );
          }

          this.resetPrice();
        }),
    );
    this.formSubscriptions.push(
      this.stops.valueChanges.subscribe(() => {
        this.resetPrice();
      }),
    );

    const pending = history.state;

    if (pending?.pickup) {
      this.applyPendingDelivery(pending);
    }
  }

  applyPendingDelivery(data: any): void {
    // Set pickup address only; coordinates must come from autocomplete.
    this.deliveryForm.patchValue({
      pickupAddress: data.pickup,
      pickupLat: null,
      pickupLng: null,

      vehicleTypeId: data.vehicleType || 8,
    });

    // Set first delivery stop.
    const firstStop = this.stops.at(0);

    firstStop.patchValue({
      address: data.drop,
      lat: null,
      lng: null,
    });

    this.resetPrice();

    this.showToastMessage(
      'Please select pickup & drop from suggestions to continue',
    );
    setTimeout(() => {
      this.pickupInput?.nativeElement?.focus();
    }, 300);
  }

  showToastMessage(message: string): void {
    this.toastMessage = message;
    this.showToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }

  loadDeliveryTypes(): void {
    this.ordersService.getDeliveryTypes().subscribe({
      next: (res: any) => {
        this.deliveryTypesConfig = res.data;
        this.buildDeliveryOptions();
      },
      error: (err) => {
        console.error('Failed to load delivery types', err);

        // Fallback delivery speed options.
        this.deliveryTypesConfig = {
          NOW: {
            label: 'Deliver Now',
            baseDescription: 'Fastest delivery',
            icon: 'flash_on',
            priority: 1,
          },
          END_OF_DAY: {
            label: 'By End of Day',
            baseDescription: 'Lower cost delivery',
            icon: 'schedule',
            priority: 2,
          },
          SCHEDULED: {
            label: 'Schedule',
            baseDescription: 'Choose pickup time',
            icon: 'event',
            priority: 3,
          },
        };

        this.buildDeliveryOptions();
      },
    });
  }

  loadVehicleOptions(): void {
    this.ordersService.getVehicleCatalog().subscribe({
      next: (res: any) => {
        const vehicles = Array.isArray(res?.data) ? res.data : [];

        if (!vehicles.length) return;

        this.vehicleOptions = vehicles.map((vehicle: any) => ({
          id: Number(vehicle.id),
          title: vehicle.name,
          description:
            vehicle.description || this.getVehicleDescription(vehicle),
          limit: vehicle.maxWeightKg ? `Up to ${vehicle.maxWeightKg} kg` : '',
          icon: this.getVehicleIcon(vehicle.code || vehicle.name),
        }));

        const selectedVehicle = this.deliveryForm.get('vehicleTypeId')?.value;
        if (
          !vehicles.some(
            (vehicle: any) => Number(vehicle.id) === selectedVehicle,
          )
        ) {
          this.deliveryForm.patchValue({
            vehicleTypeId: Number(vehicles[0].id),
          });
        }
      },
      error: (err) => {
        console.error('Vehicle catalog failed', err);
      },
    });
  }

  getVehicleDescription(vehicle: any): string {
    const limit = vehicle.maxWeightKg
      ? `up to ${vehicle.maxWeightKg} kg`
      : 'cargo';
    return `Suitable for ${limit}`;
  }

  getVehicleIcon(value: string): string {
    const normalized = String(value || '').toLowerCase();

    if (normalized.includes('bike') || normalized.includes('motor')) {
      return 'two_wheeler';
    }

    if (normalized.includes('ace') || normalized.includes('van')) {
      return 'airport_shuttle';
    }

    return 'local_shipping';
  }

  buildDeliveryOptions(): void {
    this.deliverySpeedOptions = Object.keys(this.deliveryTypesConfig)
      .map((code) => {
        const item = this.deliveryTypesConfig[code];

        return {
          code,
          title: item.label,
          description: item.baseDescription,
          icon: item.icon,
          priority: item.priority,
        };
      })
      .sort((a, b) => a.priority - b.priority);
  }

  applyModeDefaults(mode: string | null): void {
    if (!mode) return;

    const user = this.authService.getUser();

    // Pickup behavior based on mode
    if (mode === 'BUSINESS') {
      this.deliveryForm.patchValue({
        pickupName: user?.name || '',
        pickupPhone: user?.phone || '',
      });
    }

    if (mode === 'PERSONAL') {
      this.deliveryForm.patchValue({
        pickupName: '',
        pickupPhone: '',
      });
    }

    const currentDeliveryType = this.deliveryForm.get('deliveryType')?.value;

    if (!currentDeliveryType || currentDeliveryType === 'NOW') {
      if (mode === 'BUSINESS') {
        this.deliveryForm.patchValue({
          deliveryType: 'NOW',
          paymentMethod: 'CASH',
        });
      }

      if (mode === 'PERSONAL') {
        this.deliveryForm.patchValue({
          deliveryType: 'END_OF_DAY',
          paymentMethod: 'CASH',
        });
      }
    }
  }

  loadSavedAddresses(): void {
    this.addressService.getAddresses().subscribe({
      next: (res: any) => {
        this.savedAddresses = res?.data || [];
      },
      error: (err) => {
        console.error('Failed to load addresses', err);
      },
    });
  }

  selectSavedAddress(event: any): void {
    const id = event.target.value;
    const selected = this.savedAddresses.find((a) => a._id === id);

    if (!selected) return;

    this.deliveryForm.patchValue({
      pickupAddress: selected.address,
      pickupLat: selected.lat,
      pickupLng: selected.lng,
      pickupName: selected.name,
      pickupPhone: selected.phone,
      pickupNotes: selected.notes || '',
    });

    this.resetPrice();
    this.renderRoute();
  }

  saveCurrentAddress(): void {
    const form = this.deliveryForm.value;

    if (!form.pickupLat || !form.pickupLng) {
      this.showToastMessage('Select address from suggestions first');
      return;
    }

    const payload = {
      label: this.mode === 'BUSINESS' ? 'OFFICE' : 'HOME',
      name: form.pickupName,
      phone: form.pickupPhone,
      address: form.pickupAddress,
      lat: form.pickupLat,
      lng: form.pickupLng,
      notes: form.pickupNotes,
    };

    this.addressService.createAddress(payload).subscribe({
      next: () => {
        this.showToastMessage('Address saved');
        this.loadSavedAddresses();
      },
      error: () => {
        this.showToastMessage('Failed to save address');
      },
    });
  }

  canAutoCalculate(): boolean {
    const form = this.deliveryForm.value;

    if (!form.pickupLat || !form.pickupLng) return false;

    if (!form.vehicleTypeId) return false;

    if (!form.package?.description) return false;

    if (!form.stops?.length) return false;

    const everyStopHasCoordinates = form.stops.every(
      (stop: any) => stop?.lat && stop?.lng,
    );

    if (!everyStopHasCoordinates) return false;

    return true;
  }
  loadBankCards(): void {
    this.ordersService.getBankCards().subscribe({
      next: (res: any) => {
        this.bankCards = res?.data || [];
      },
      error: (err) => {
        console.error('Failed to load bank cards', err);
      },
    });
  }

  handleCheckout(): void {
    if (!this.priceSummary.total) {
      this.showToastMessage('Please calculate price first');
      return;
    }

    if (this.isPaymentProcessing || this.isCreatingOrder) {
      return;
    }

    this.currentStep = 3;
    this.processOnlinePayment();
  }

  processOnlinePayment(): void {
    this.isPaymentProcessing = true;

    this.ordersService
      .createPaymentIntent({
        amount: this.priceSummary.total,
        paymentMethod: 'UPI',
      })
      .subscribe({
        next: (res: any) => {
          const intentId = res?.data?.intentId;

          if (!intentId) {
            this.isPaymentProcessing = false;
            this.showToastMessage('Payment could not be initialized');
            return;
          }

          this.ordersService.confirmMockPaymentIntent(intentId).subscribe({
            next: () => {
              this.paymentCompleted = true;
              this.paymentIntentId = intentId;
              this.isPaymentProcessing = false;
              this.createOrder();
            },
            error: (err) => {
              this.isPaymentProcessing = false;
              this.showToastMessage(
                err?.error?.message || 'Payment confirmation failed',
              );
            },
          });
        },
        error: (err) => {
          this.isPaymentProcessing = false;
          this.showToastMessage(
            err?.error?.message || 'Payment could not be initialized',
          );
        },
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.isGoogleMapsReady()) {
        return;
      }

      this.initMap();
      this.initPickupAutocomplete();
      this.attachStopAutocompletes();
    }, 300);

    this.stopInputSubscription = this.stopInputs.changes.subscribe(() => {
      setTimeout(() => this.attachStopAutocompletes(), 300);
    });
  }

  selectVehicle(vehicleId: number): void {
    this.deliveryForm.patchValue({
      vehicleTypeId: vehicleId,
    });

    this.resetPrice();

    // if (this.canAutoCalculate()) {
    //   this.calculatePrice();
    // }
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
      scheduledAt: [null],
      paymentMethod: ['BALANCE', Validators.required],
      bankCardId: [null],

      vehicleTypeId: [8, Validators.required],

      parcelValue: [null, [Validators.min(0), Validators.max(50000)]],
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
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      notes: [''],
    });
  }

  addStop(): void {
    if (this.deliveryForm.get('deliveryType')?.value === 'END_OF_DAY') {
      this.showToastMessage('End-of-day delivery supports one drop address');
      return;
    }

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

  onParcelValueChange(): void {
    this.resetPrice();
  }

  async calculatePrice(): Promise<void> {
    const form = this.deliveryForm.value;

    if (form.deliveryType === 'SCHEDULED' && !this.isScheduleValid()) {
      this.showToastMessage('Please select a valid future time');
      return;
    }

    if (this.isCalculatingPrice) {
      return;
    }

    if (!form.pickupLat || !form.pickupLng) {
      this.showToastMessage('Please select pickup from suggestions');
      return;
    }

    const deliveryStops = this.buildDeliveryStops(form);
    const lastStop = deliveryStops[deliveryStops.length - 1];

    if (!lastStop.lat || !lastStop.lng) {
      this.showToastMessage('Please select delivery from suggestions');
      return;
    }

    this.currentStep = 2;

    this.isCalculatingPrice = true;

    try {
      const payload = {
        matter: form.package.description,
        vehicleTypeId: form.vehicleTypeId,
        deliveryType: form.deliveryType,
        scheduledAt:
          form.deliveryType === 'SCHEDULED'
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
        pickup: {
          address: form.pickupAddress,
          lat: form.pickupLat,
          lng: form.pickupLng,
        },
        drop: {
          address: lastStop.address,
          lat: lastStop.lat,
          lng: lastStop.lng,
        },

        // stops: [
        //   {
        //     type: 'PICKUP',
        //     address: form.pickupAddress,
        //     lat: form.pickupLat,
        //     lng: form.pickupLng,
        //   },
        //   ...deliveryStops,
        // ],
        stops: deliveryStops,

        package: {
          weight: form.package.weight,
          declaredValue: form.parcelValue || 0,
        },
      };

      this.ordersService.calculatePrice(payload).subscribe({
        next: (res: any) => {
          const amount = res?.data?.amount || 0;
          const insurance = res?.data?.insurance || 0;
          const deliveryFee =
            res?.data?.deliveryFee ?? Math.max(amount - insurance, 0);

          this.enrichDeliveryOptions(amount);
          this.insuranceCharge = insurance;
          this.priceSummary.deliveryFee = deliveryFee;
          this.priceSummary.insurance = insurance;
          this.priceSummary.taxableAmount = res?.data?.taxableAmount || 0;
          this.priceSummary.gstRate = res?.data?.gstRate || 0;
          this.priceSummary.gstAmount = res?.data?.gstAmount || 0;
          this.priceSummary.total = amount;

          this.isCalculatingPrice = false;
        },

        error: (err) => {
          console.error('Price calculation failed', err);

          this.isCalculatingPrice = false;

          const message =
            err?.error?.message ||
            err?.error?.errors?.[0] ||
            err?.message ||
            'Price calculation failed';

          this.showToastMessage(message);
        },
      });
    } catch (error) {
      console.error('Distance calculation failed', error);
      this.isCalculatingPrice = false;
    }
  }

  createOrder(): void {
    const form = this.deliveryForm.value;

    if (this.isCreatingOrder) {
      return;
    }

    if (!this.canAutoCalculate()) {
      this.showToastMessage(
        'Please complete valid pickup and delivery addresses',
      );
      return;
    }

    if (form.deliveryType === 'SCHEDULED' && !this.isScheduleValid()) {
      this.showToastMessage('Please select a valid future time');
      return;
    }
    if (!this.priceSummary.total) {
      this.showToastMessage('Please calculate price first');

      return;
    }

    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      this.scrollToFirstInvalidField();
      return;
    }

    this.isCreatingOrder = true;

    const deliveryStops = this.buildDeliveryStops(form);
    const lastStop = deliveryStops[deliveryStops.length - 1];

    const payload = {
      matter: form.package.description,

      vehicleTypeId: form.vehicleTypeId,
      scheduledAt:
        form.deliveryType === 'SCHEDULED'
          ? new Date(form.scheduledAt).toISOString()
          : undefined,
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
        address: lastStop.address,
        lat: lastStop.lat,
        lng: lastStop.lng,
      },

      // stops: [
      //   {
      //     type: 'PICKUP',
      //     address: form.pickupAddress,
      //     lat: form.pickupLat,
      //     lng: form.pickupLng,
      //     phone: form.pickupPhone,
      //     name: form.pickupName,
      //     notes: form.pickupNotes || null,
      //   },
      //   ...deliveryStops,
      // ],

      stops: deliveryStops,

      package: {
        weight: form.package.weight,
        category: form.package.category,
        description: form.package.description,
        declaredValue: form.parcelValue || 0,
      },

      payment: {
        method: 'BALANCE',
        intentId: this.paymentIntentId,
        feePayer: 'DROP',
        ...(form.paymentMethod === 'BANK_CARD' && form.bankCardId
          ? {
              bankCardId: Number(form.bankCardId),
            }
          : {}),
      },
    };

    this.ordersService.createOrder(payload).subscribe({
      next: (res: any) => {
        this.isCreatingOrder = false;

        const orderId = res?.data?._id;

        const lastDelivery = {
          pickup: {
            address: form.pickupAddress,
            name: form.pickupName,
            phone: form.pickupPhone,
          },
          drop: {
            address: lastStop.address,
            name: lastStop.name,
            phone: lastStop.phone,
          },
          package: form.package,
        };

        localStorage.setItem('LAST_DELIVERY', JSON.stringify(lastDelivery));
        this.hasLastDelivery = true;

        try {
          this.analytics.trackEvent('order_created', {
            transaction_id: orderId,
            value: this.priceSummary.total,
            currency: 'INR',

            delivery_fee: this.priceSummary.deliveryFee,
            insurance: this.priceSummary.insurance,
            gst: this.priceSummary.gstAmount,

            payment_method: 'BALANCE',
            vehicle_type: this.deliveryForm.value.vehicleTypeId,
            delivery_type: this.deliveryForm.value.deliveryType,
          });
        } catch (e) {}

        this.router.navigate(['/app/orders', orderId]);
      },

      error: (err) => {
        this.isCreatingOrder = false;

        this.resetPrice();

        const message =
          err?.error?.message ||
          err?.error?.errors?.[0] ||
          'Order creation failed. Please try again.';

        this.showToastMessage(message);
      },
    });
  }

  private buildDeliveryStops(form: any): any[] {
    return (form.stops || []).map((stop: any) => ({
      type: 'DROP',
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
      phone: stop.phone,
      name: stop.name,
      notes: stop.notes || null,
    }));
  }

  enrichDeliveryOptions(nowPrice: number): void {
    this.deliverySpeedOptions = this.deliverySpeedOptions.map((opt) => {
      if (opt.code === 'NOW') {
        return {
          ...opt,
          description: 'Fastest delivery available',
          price: nowPrice,
        };
      }

      if (opt.code === 'END_OF_DAY') {
        const discounted = Math.round(nowPrice * 0.85);
        const saving = nowPrice - discounted;
        return {
          ...opt,
          description: saving > 0 ? `Save ₹${saving}` : 'Lower cost delivery',
          price: discounted,
        };
      }

      if (opt.code === 'SCHEDULED') {
        return {
          ...opt,
          description: 'Choose pickup time',
        };
      }

      return opt;
    });
  }

  dropStops(event: CdkDragDrop<any[]>): void {
    const stopsArray = this.stops;

    moveItemInArray(
      stopsArray.controls,
      event.previousIndex,
      event.currentIndex,
    );

    stopsArray.updateValueAndValidity();

    this.renderRoute();

    if (this.canAutoCalculate()) {
      this.calculatePrice();
    }
  }

  loadLastDelivery(): void {
    const data = localStorage.getItem('LAST_DELIVERY');
    if (!data) return;

    const last = JSON.parse(data);

    // Fill visible fields
    this.deliveryForm.patchValue({
      pickupAddress: last.pickup.address,
      pickupName: last.pickup.name,
      pickupPhone: last.pickup.phone,
      package: last.package,

      // Reset coordinates
      pickupLat: null,
      pickupLng: null,
    });

    const stop = this.stops.at(0);

    stop.patchValue({
      address: last.drop.address,
      name: last.drop.name,
      phone: last.drop.phone,

      // ❗ RESET coordinates
      lat: null,
      lng: null,
    });

    this.showToastMessage(
      'Please select pickup & delivery locations from suggestions',
    );

    // Focus user to take action
    this.pickupInput.nativeElement.focus();
  }

  selectPayment(type: string): void {
    if (type !== 'BALANCE') {
      this.showToastMessage('Selected payment method is not enabled');
      return;
    }

    this.deliveryForm.get('paymentMethod')?.setValue('BALANCE');
    this.deliveryForm.get('bankCardId')?.setValue(null);
  }

  selectCategory(category: string): void {
    const currentPackage = this.deliveryForm.get('package')?.value;

    this.deliveryForm.patchValue({
      package: {
        ...currentPackage,
        category: category,
        description: category,
      },
    });

    this.resetPrice();
  }
  resetPrice(): void {
    this.insuranceCharge = 0;
    this.priceSummary = {
      deliveryFee: 0,
      insurance: 0,
      taxableAmount: 0,
      gstRate: 0,
      gstAmount: 0,
      total: 0,
    };
    this.paymentCompleted = false;
    this.paymentIntentId = null;
  }
  selectWeight(weight: number): void {
    this.deliveryForm.get('package.weight')?.setValue(weight);
  }

  selectDeliveryType(type: string): void {
    if (type === 'END_OF_DAY' && this.stops.length > 1) {
      while (this.stops.length > 1) {
        this.stops.removeAt(this.stops.length - 1);
      }
      this.stopAutocompleteInstances = this.stopAutocompleteInstances.slice(
        0,
        1,
      );
      this.showToastMessage('End-of-day delivery uses one drop address');
    }

    this.deliveryForm.patchValue({
      deliveryType: type,
    });

    if (type !== 'SCHEDULED') {
      this.deliveryForm.patchValue({
        scheduledAt: null,
      });
    }

    this.resetPrice();

    // if (this.canAutoCalculate()) {
    //   this.calculatePrice();
    // }
  }

  isScheduleValid(): boolean {
    const value = this.deliveryForm.get('scheduledAt')?.value;

    if (!value) return false;

    const selectedTime = new Date(value).getTime();
    const now = Date.now();

    return selectedTime > now;
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
    if (!this.isGoogleMapsReady() || !google.maps.places?.Autocomplete) {
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(
      this.pickupInput.nativeElement,
      {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        types: ['geocode'],
      },
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      if (this.map) {
        this.map.setCenter({ lat, lng });
        this.map.setZoom(14);
      }
      this.deliveryForm.patchValue({
        pickupAddress:
          place.formatted_address ||
          place.name ||
          this.pickupInput.nativeElement.value,
        pickupLat: lat,
        pickupLng: lng,
      });
      this.resetPrice();
      this.renderRoute();
    });
  }

  attachStopAutocompletes(): void {
    if (!this.isGoogleMapsReady() || !google.maps.places?.Autocomplete) {
      return;
    }

    this.stopInputs.forEach((input, index) => {
      if (this.stopAutocompleteInstances[index]) {
        return;
      }
      const autocomplete = new google.maps.places.Autocomplete(
        input.nativeElement,
        {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          types: ['geocode'],
        },
      );

      this.stopAutocompleteInstances[index] = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const stopGroup = this.stops.at(index);

        stopGroup.patchValue({
          address:
            place.formatted_address ||
            place.name ||
            input.nativeElement.value,
          lat,
          lng,
        });
        this.resetPrice();
        this.renderRoute();
      });
    });
  }

  /* -------------------------------
      ROUTE DISTANCE CALCULATION
  -------------------------------- */

  // async calculateRouteDistance(): Promise<number> {
  //   if (!this.directionsService) {
  //     throw new Error('Directions service not initialized');
  //   }
  //   const directionsService = this.directionsService;
  //   const form = this.deliveryForm.value;

  //   if (!form.pickupLat || !form.pickupLng) {
  //     throw new Error('Pickup coordinates missing');
  //   }

  //   for (const stop of form.stops) {
  //     if (!stop.lat || !stop.lng) {
  //       throw new Error('Stop coordinates missing');
  //     }
  //   }
  //   const origin = {
  //     lat: form.pickupLat,
  //     lng: form.pickupLng,
  //   };

  //   const destination = {
  //     lat: form.stops[form.stops.length - 1].lat,
  //     lng: form.stops[form.stops.length - 1].lng,
  //   };

  //   const waypoints = form.stops.slice(0, -1).map((stop: any) => ({
  //     location: { lat: stop.lat, lng: stop.lng },
  //     stopover: true,
  //   }));

  //   return new Promise((resolve, reject) => {
  //     directionsService.route(
  //       {
  //         origin,
  //         destination,
  //         waypoints,
  //         travelMode: google.maps.TravelMode.DRIVING,
  //       },
  //       (result: any, status: any) => {
  //         if (status !== 'OK') {
  //           reject(status);
  //           return;
  //         }

  //         let totalDistance = 0;

  //         result.routes[0].legs.forEach((leg: any) => {
  //           totalDistance += leg.distance.value;
  //         });

  //         resolve(totalDistance / 1000);
  //       },
  //     );
  //   });
  // }

  initMap(): void {
    if (this.map) return;
    if (!this.isGoogleMapsReady() || !this.routeMap?.nativeElement) return;

    this.map = new google.maps.Map(this.routeMap.nativeElement, {
      zoom: 12,
      center: { lat: 20.5937, lng: 78.9629 },
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: this.themeColor('--mk-primary', '#ff7a00'),
        strokeWeight: 4,
      },
    });

    this.directionsRenderer.setMap(this.map);
    this.geocoder = new google.maps.Geocoder();
  }

  renderRoute(): void {
    if (!this.map || !this.directionsRenderer) return;

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
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));
    this.routeService
      .calculateRouteWithWaypoints(origin, destination, waypoints)
      .then((result: any) => {
        this.directionsRenderer.setDirections(result);

        const bounds = result.routes[0].bounds;
        this.map.fitBounds(bounds);

        if (!this.pickupMarker) {
          this.pickupMarker = new google.maps.Marker({
            map: this.map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: this.themeColor('--mk-success', '#22c55e'),
              fillOpacity: 1,
              strokeColor: this.themeColor('--mk-card-bg', '#ffffff'),
              strokeWeight: 3,
            },
            zIndex: 100,
          });
        }

        if (!this.dropMarker) {
          this.dropMarker = new google.maps.Marker({
            map: this.map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: this.themeColor('--mk-danger', '#ef4444'),
              fillOpacity: 1,
              strokeColor: this.themeColor('--mk-card-bg', '#ffffff'),
              strokeWeight: 3,
            },
            zIndex: 100,
          });
        }

        this.pickupMarker.setPosition(origin);
        this.dropMarker.setPosition(destination);
      })
      .catch((err: any) => {
        console.error('Route error', err);
      });
  }

  scrollToFirstInvalidField(): void {
    setTimeout(() => {
      const invalid = this.routeMap?.nativeElement
        ?.closest('body')
        ?.querySelector(
          'input.ng-invalid, textarea.ng-invalid, select.ng-invalid',
        ) as HTMLElement;

      if (!invalid) return;

      invalid.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      invalid.focus();
    }, 200);
  }
}
