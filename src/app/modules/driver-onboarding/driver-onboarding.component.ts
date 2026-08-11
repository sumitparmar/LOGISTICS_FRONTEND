import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { DriverOnboardingService } from './driver-onboarding.service';

declare const google: any;

@Component({
  selector: 'app-driver-onboarding',
  templateUrl: './driver-onboarding.component.html',
  styleUrls: ['./driver-onboarding.component.scss'],
})
export class DriverOnboardingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChildren('areaInput') areaInputs!: QueryList<ElementRef>;
  form!: FormGroup;
  vehicles: any[] = [];
  requiredConsents: any[] = [];
  serviceAreaCountry = 'in';
  requireGooglePlaceSelection = false;
  mapsReady = false;
  mapsUnavailable = false;
  application: any = null;
  isLoading = false;
  isSaving = false;
  isSubmitting = false;

  availabilityOptions: any[] = [];
  private areaAutocompleteInstances: any[] = [];
  private areaInputSub: any;
  private mapsRetryTimer: any;
  private mapsRetryAttempts = 0;

  constructor(
    private fb: FormBuilder,
    private onboardingService: DriverOnboardingService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadOptions();
    this.loadApplication();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.attachAreaAutocompletes(), 250);
    this.areaInputSub = this.areaInputs.changes.subscribe(() => {
      setTimeout(() => this.attachAreaAutocompletes(), 250);
    });
  }

  ngOnDestroy(): void {
    this.areaInputSub?.unsubscribe?.();
    if (this.mapsRetryTimer) {
      clearTimeout(this.mapsRetryTimer);
    }
    this.areaAutocompleteInstances.forEach((instance) => {
      if (instance && typeof google !== 'undefined' && google.maps?.event) {
        google.maps.event.clearInstanceListeners(instance);
      }
    });
    this.areaAutocompleteInstances = [];
  }

  initForm(): void {
    this.form = this.fb.group({
      personal: this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        email: ['', [Validators.email]],
        city: ['', Validators.required],
        address: ['', [Validators.required, Validators.minLength(8)]],
        dateOfBirth: [''],
      }),
      vehicle: this.fb.group({
        vehicleTypeId: [null, Validators.required],
        registrationNumber: [''],
        drivingLicenseNumber: ['', Validators.required],
      }),
      documents: this.fb.group({
        aadhaarNumber: ['', [Validators.pattern(/^[0-9]{12}$/)]],
        panNumber: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)]],
        licenseUrl: [''],
        rcUrl: [''],
        aadhaarUrl: [''],
        panUrl: [''],
      }),
      payout: this.fb.group({
        accountHolderName: [''],
        bankName: [''],
        accountNumberLast4: ['', [Validators.pattern(/^[0-9]{4}$/)]],
        ifsc: ['', [Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      }),
      servicePreferences: this.fb.group({
        preferredAreas: this.fb.array([this.createAreaGroup()]),
        availability: ['FLEXIBLE', Validators.required],
      }),
      consent: this.fb.group({
        termsAccepted: [false, Validators.requiredTrue],
        backgroundCheckAccepted: [false, Validators.requiredTrue],
      }),
    });
  }

  get preferredAreas(): FormArray {
    return this.form.get('servicePreferences.preferredAreas') as FormArray;
  }

  createAreaGroup(value: any = null): FormGroup {
    const normalized =
      typeof value === 'string'
        ? { address: value }
        : value || {};

    return this.fb.group({
      address: [normalized.address || '', Validators.required],
      placeId: [normalized.placeId || null],
      city: [normalized.city || null],
      lat: [normalized.lat ?? null],
      lng: [normalized.lng ?? null],
      source: [normalized.source || (normalized.placeId ? 'GOOGLE_PLACES' : 'MANUAL')],
    });
  }

  loadOptions(): void {
    this.onboardingService.getOptions().subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        this.vehicles = data.vehicles || [];
        this.availabilityOptions = data.availabilityOptions || [];
        this.requiredConsents = data.requiredConsents || [];
        this.serviceAreaCountry = data.serviceAreaCountry || 'in';
        this.requireGooglePlaceSelection = Boolean(
          data.requireGooglePlaceSelection,
        );
        setTimeout(() => this.attachAreaAutocompletes(), 100);
      },
      error: () => {
        this.toastService.error('Unable to load onboarding options');
      },
    });
  }

  loadApplication(): void {
    this.isLoading = true;
    this.onboardingService.getMine().subscribe({
      next: (res: any) => {
        this.application = res?.data || null;
        if (this.application) {
          this.patchApplication(this.application);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  patchApplication(application: any): void {
    const areas = application.servicePreferences?.preferredAreas || [''];
    this.preferredAreas.clear();
    (areas.length ? areas : [null]).forEach((area: any) =>
      this.preferredAreas.push(this.createAreaGroup(area)),
    );

    this.form.patchValue({
      personal: application.personal || {},
      vehicle: application.vehicle || {},
      documents: application.documents || {},
      payout: application.payout || {},
      servicePreferences: {
        availability:
          application.servicePreferences?.availability || 'FLEXIBLE',
      },
      consent: application.consent || {},
    });
  }

  addArea(): void {
    this.preferredAreas.push(this.createAreaGroup());
    setTimeout(() => this.attachAreaAutocompletes(), 100);
  }

  removeArea(index: number): void {
    if (this.preferredAreas.length === 1) {
      this.preferredAreas.at(0).reset({
        address: '',
        placeId: null,
        city: null,
        lat: null,
        lng: null,
        source: 'MANUAL',
      });
      return;
    }
    this.preferredAreas.removeAt(index);
    this.areaAutocompleteInstances.splice(index, 1);
  }

  consentControl(key: string) {
    return this.form.get(`consent.${key}`);
  }

  saveDraft(): void {
    if (this.isLocked || this.isSaving) return;

    this.isSaving = true;
    this.onboardingService.saveMine(this.payload).subscribe({
      next: (res: any) => {
        this.application = res?.data;
        this.isSaving = false;
        this.toastService.success('Driver onboarding draft saved');
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.error(err?.error?.message || 'Draft save failed');
      },
    });
  }

  submit(): void {
    if (this.isLocked || this.isSubmitting) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Please complete required onboarding details');
      return;
    }

    if (!this.hasValidPreferredAreas()) {
      this.toastService.warning('Please select at least one preferred service area');
      return;
    }

    this.isSubmitting = true;
    this.onboardingService.submitMine(this.payload).subscribe({
      next: (res: any) => {
        this.application = res?.data;
        this.isSubmitting = false;
        this.toastService.success('Driver onboarding submitted for review');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastService.error(err?.error?.message || 'Submission failed');
      },
    });
  }

  get payload(): any {
    const value = this.form.value;
    return {
      ...value,
      servicePreferences: {
        ...value.servicePreferences,
        preferredAreas: (value.servicePreferences.preferredAreas || [])
          .map((area: any) => ({
            ...area,
            address: String(area?.address || '').trim(),
          }))
          .filter((area: any) => area.address),
      },
    };
  }

  hasValidPreferredAreas(): boolean {
    const areas = this.payload.servicePreferences.preferredAreas || [];
    if (!areas.length) return false;

    if (!this.requireGooglePlaceSelection) return true;

    return areas.every((area: any) => !!area.placeId);
  }

  get isLocked(): boolean {
    return ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(
      this.application?.status,
    );
  }

  statusLabel(status?: string): string {
    return String(status || 'DRAFT').replace(/_/g, ' ');
  }

  private attachAreaAutocompletes(): void {
    if (
      typeof google === 'undefined' ||
      !google.maps ||
      !google.maps.places
    ) {
      if (this.mapsRetryAttempts < 20) {
        this.mapsRetryAttempts += 1;
        this.mapsRetryTimer = setTimeout(
          () => this.attachAreaAutocompletes(),
          250,
        );
        return;
      }
      this.mapsReady = false;
      this.mapsUnavailable = true;
      return;
    }

    this.mapsRetryAttempts = 0;
    this.mapsReady = true;
    this.mapsUnavailable = false;

    this.areaInputs?.forEach((inputRef, index) => {
      if (this.areaAutocompleteInstances[index] || this.isLocked) return;

      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.nativeElement,
        {
          componentRestrictions: { country: this.serviceAreaCountry },
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
          types: ['geocode'],
        },
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place?.formatted_address && !place?.name) return;

        const area = this.preferredAreas.at(index);
        area.patchValue({
          address: place.formatted_address || place.name,
          placeId: place.place_id || null,
          city: this.extractCity(place),
          lat: place.geometry?.location?.lat?.() ?? null,
          lng: place.geometry?.location?.lng?.() ?? null,
          source: place.place_id ? 'GOOGLE_PLACES' : 'MANUAL',
        });
      });

      this.areaAutocompleteInstances[index] = autocomplete;
    });
  }

  private extractCity(place: any): string | null {
    const components = place?.address_components || [];
    const cityComponent = components.find((component: any) =>
      component.types?.some((type: string) =>
        ['locality', 'administrative_area_level_2', 'sublocality'].includes(type),
      ),
    );

    return cityComponent?.long_name || null;
  }
}
