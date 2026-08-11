import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrdersService } from 'src/app/core/services/orders.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { DriverOnboardingService } from './driver-onboarding.service';

@Component({
  selector: 'app-driver-onboarding',
  templateUrl: './driver-onboarding.component.html',
  styleUrls: ['./driver-onboarding.component.scss'],
})
export class DriverOnboardingComponent implements OnInit {
  form!: FormGroup;
  vehicles: any[] = [];
  application: any = null;
  isLoading = false;
  isSaving = false;
  isSubmitting = false;

  availabilityOptions = [
    { value: 'FLEXIBLE', label: 'Flexible' },
    { value: 'FULL_TIME', label: 'Full time' },
    { value: 'PART_TIME', label: 'Part time' },
    { value: 'WEEKENDS', label: 'Weekends' },
  ];

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private onboardingService: DriverOnboardingService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadVehicles();
    this.loadApplication();
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
        preferredAreas: this.fb.array([this.fb.control('')]),
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

  loadVehicles(): void {
    this.ordersService.getVehicleCatalog().subscribe({
      next: (res: any) => {
        this.vehicles = res?.data || [];
      },
      error: () => {
        this.toastService.error('Unable to load vehicle types');
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
    areas.forEach((area: string) => this.preferredAreas.push(this.fb.control(area)));

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
    this.preferredAreas.push(this.fb.control(''));
  }

  removeArea(index: number): void {
    if (this.preferredAreas.length === 1) {
      this.preferredAreas.at(0).setValue('');
      return;
    }
    this.preferredAreas.removeAt(index);
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
          .map((area: string) => String(area || '').trim())
          .filter(Boolean),
      },
    };
  }

  get isLocked(): boolean {
    return ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(
      this.application?.status,
    );
  }

  statusLabel(status?: string): string {
    return String(status || 'DRAFT').replace(/_/g, ' ');
  }
}
