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
  private stopInputSubscription: any;
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
    total: 0,
  };
  currentStep = 1;

  weightOptions = [1, 5, 10, 15, 20];

  packageCategories = [
    'Documents',
    'Clothes',
    'Groceries',
    'Medicine',
    'Food',
    'Parcel',
  ];

  // deliverySpeedOptions = [
  //   {
  //     code: 'NOW',
  //     title: 'Deliver Now',
  //     description: 'Courier arrives immediately',
  //     icon: 'flash_on',
  //   },
  //   {
  //     code: 'END_OF_DAY',
  //     title: 'By End of Day',
  //     description: 'Lower price delivery',
  //     icon: 'schedule',
  //   },
  //   {
  //     code: 'SCHEDULED',
  //     title: 'Schedule',
  //     description: 'Choose pickup time',
  //     icon: 'event',
  //   },
  // ];

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
    { label: 'Cash on Delivery', value: 'CASH' },
    { label: 'Pay via Card', value: 'BANK_CARD' },
  ];

  showReorderModal = false;

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
      if (instance) {
        google.maps.event.clearInstanceListeners(instance);
      }
    });

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }
    if (this.modeSub) {
      this.modeSub.unsubscribe();
    }
    this.stopAutocompleteInstances = [];

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  // ngOnInit(): void {
  //   this.initializeForm();

  //   this.deliveryForm.valueChanges.pipe(debounceTime(600)).subscribe(() => {
  //     if (!this.canAutoCalculate()) return;

  //     this.resetPrice();

  //     this.calculatePrice();
  //   });
  //   this.deliveryForm.get('package.weight')?.valueChanges.subscribe(() => {
  //     this.resetPrice();
  //   });

  //   this.deliveryForm.get('package.description')?.valueChanges.subscribe(() => {
  //     this.resetPrice();
  //   });
  // }

  ngOnInit(): void {
    this.initializeForm();
    this.loadSavedAddresses();
    this.loadDeliveryTypes();
    this.hasLastDelivery = !!localStorage.getItem('LAST_DELIVERY');
    // this.loadLastDelivery();
    this.modeSub = this.authService.deliveryMode$.subscribe((mode) => {
      this.mode = mode;
      this.applyModeDefaults(mode);

      if (mode === 'BUSINESS') {
        this.loadBankCards();
      }
    });

    this.deliveryForm.valueChanges.pipe(debounceTime(600)).subscribe(() => {
      if (!this.canAutoCalculate()) return;

      this.resetPrice();
      this.calculatePrice();
    });

    this.deliveryForm.get('package.weight')?.valueChanges.subscribe(() => {
      this.resetPrice();
    });

    this.deliveryForm.get('package.description')?.valueChanges.subscribe(() => {
      this.resetPrice();
    });

    const pending = history.state;

    if (pending?.pickup) {
      this.applyPendingDelivery(pending);
    }
  }

  // applyModeDefaults(mode: string | null): void {
  //   if (!mode) return;

  //   if (this.deliveryForm.get('vehicleTypeId')?.value !== 1) return;

  //   if (mode === 'BUSINESS') {
  //     this.deliveryForm.patchValue({
  //       deliveryType: 'NOW',
  //       paymentMethod: 'CASH',
  //     });
  //   }

  //   if (mode === 'PERSONAL') {
  //     this.deliveryForm.patchValue({
  //       deliveryType: 'EOD',
  //       paymentMethod: 'CASH',
  //     });
  //   }
  // }
  applyPendingDelivery(data: any): void {
    // 🔹 Set pickup (ONLY ADDRESS — lat/lng must come from autocomplete)
    this.deliveryForm.patchValue({
      pickupAddress: data.pickup,
      pickupLat: null,
      pickupLng: null,

      vehicleTypeId: data.vehicleType || 1,
    });

    // 🔹 Set first stop (drop)
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

        // ✅ FALLBACK (PRODUCTION SAFE)
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

    // 🔹 Pickup behavior based on mode
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

    const lastStop = form.stops[form.stops.length - 1];

    if (!lastStop?.lat || !lastStop?.lng) return false;

    return true;
  }
  loadBankCards(): void {
    this.ordersService.getBankCards().subscribe({
      next: (res: any) => {
        console.log('BANK CARDS RESPONSE:', res);

        this.bankCards = res?.data || [];
      },
      error: (err) => {
        console.error('Failed to load bank cards', err);
      },
    });
  }
  handleCheckout(): void {
    const form = this.deliveryForm.value;

    if (!this.priceSummary.total) {
      this.showToastMessage('Please calculate price first');

      return;
    }

    const paymentMethod = form.paymentMethod;

    if (paymentMethod === 'CASH') {
      this.createOrder();
      return;
    }

    // Temporary block until gateway API exists
    alert('Online payment will be available soon');
  }

  processOnlinePayment(): void {
    // this.isPaymentProcessing = true;
    // // Temporary mock payment
    // // Replace later with Razorpay / your gateway
    // setTimeout(() => {
    //   this.isPaymentProcessing = false;
    //   this.paymentCompleted = true;
    //   this.createOrder();
    // }, 1500);
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

    this.resetPrice();

    if (this.canAutoCalculate()) {
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
      scheduledAt: [null],
      paymentMethod: ['CASH', Validators.required],
      bankCardId: [null],

      vehicleTypeId: [1, Validators.required],

      parcelValue: [null],
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
    const value = this.deliveryForm.get('parcelValue')?.value || 0;

    if (!value || value <= 0) {
      this.insuranceCharge = 0;

      this.priceSummary.insurance = 0;
      this.priceSummary.total = this.priceSummary.deliveryFee;

      return;
    }

    this.insuranceCharge = Math.round(2 + value * 0.01);

    this.priceSummary.insurance = this.insuranceCharge;
    this.priceSummary.total =
      this.priceSummary.deliveryFee + this.insuranceCharge;
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

    const lastStop = form.stops[form.stops.length - 1];

    if (!lastStop.lat || !lastStop.lng) {
      this.showToastMessage('Please select delivery from suggestions');
      return;
    }

    this.currentStep = 2;

    // if (!form.pickupLat || !form.pickupLng) {
    //   alert('Please select pickup address from suggestions');
    //   return;
    // }

    // for (const stop of form.stops) {
    //   if (!stop.lat || !stop.lng) {
    //     alert('Please select delivery address from suggestions');
    //     return;
    //   }
    // }

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
          address: form.stops[form.stops.length - 1].address,
          lat: form.stops[form.stops.length - 1].lat,
          lng: form.stops[form.stops.length - 1].lng,
        },
      };

      this.ordersService.calculatePrice(payload).subscribe({
        next: (res: any) => {
          const amount = res?.data?.amount || 0;
          this.enrichDeliveryOptions(amount);
          this.priceSummary.deliveryFee = amount;
          this.priceSummary.insurance = this.insuranceCharge;
          this.priceSummary.total = amount + this.insuranceCharge;

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
    const form = this.deliveryForm.value;
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

    const lastStop = form.stops[form.stops.length - 1];

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

      stops: [
        {
          type: 'PICKUP',
          address: form.pickupAddress,
          lat: form.pickupLat,
          lng: form.pickupLng,
          phone: form.pickupPhone,
          name: form.pickupName,
        },
        {
          type: 'DROP',
          address: lastStop.address,
          lat: lastStop.lat,
          lng: lastStop.lng,
          phone: lastStop.phone,
          name: lastStop.name,
        },
      ],

      package: {
        weight: form.package.weight,
        category: form.package.category,
        description: form.package.description,
        declaredValue: form.parcelValue || 0,
      },

      payment: {
        method: form.paymentMethod,
        feePayer: 'DROP',
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

            payment_method: this.deliveryForm.value.paymentMethod,
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
        const discounted = nowPrice;
        return {
          ...opt,
          description: `Save ₹${nowPrice - discounted}`,
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

    // ✅ Fill visible fields
    this.deliveryForm.patchValue({
      pickupAddress: last.pickup.address,
      pickupName: last.pickup.name,
      pickupPhone: last.pickup.phone,
      package: last.package,

      // ❗ RESET coordinates (VERY IMPORTANT)
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

    // ✅ Focus user to take action
    this.pickupInput.nativeElement.focus();
  }

  selectPayment(type: string): void {
    this.deliveryForm.get('paymentMethod')?.setValue(type);

    if (type !== 'BANK_CARD') {
      this.deliveryForm.get('bankCardId')?.setValue(null);
    }
  }

  selectCategory(category: string): void {
    const currentPackage = this.deliveryForm.get('package')?.value;

    this.deliveryForm.patchValue({
      package: {
        ...currentPackage,
        category: category,
        description: category, // ✅ ALWAYS update
      },
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

    if (type !== 'SCHEDULED') {
      this.deliveryForm.patchValue({
        scheduledAt: null,
      });
    }

    this.resetPrice();

    if (this.canAutoCalculate()) {
      this.calculatePrice();
    }
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
    const autocomplete = new google.maps.places.Autocomplete(
      this.pickupInput.nativeElement,
      { types: ['geocode'] },
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
        pickupAddress: place.formatted_address,
        pickupLat: lat,
        pickupLng: lng,
      });
      this.resetPrice();
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
    this.map = new google.maps.Map(this.routeMap.nativeElement, {
      zoom: 12,
      center: { lat: 20.5937, lng: 78.9629 },
    });

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
      })
      .catch((err: any) => {
        console.error('Route error', err);
      });
  }

  scrollToFirstInvalidField(): void {
    setTimeout(() => {
      const invalid = document.querySelector(
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
