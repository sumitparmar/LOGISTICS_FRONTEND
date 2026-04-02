import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminPricingService } from '../../services/admin-pricing.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
})
export class PricingComponent implements OnInit {
  destroy$ = new Subject<void>();
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  simulatedBase = 100;
  simulatedResult = 100;
  adminAnalytics: any;
  chartData: any;
  constructor(
    private fb: FormBuilder,
    private pricingService: AdminPricingService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPricing();
    this.loadAdminAnalytics();
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculatePreview();
    });
  }

  initForm() {
    this.form = this.fb.group({
      marginPercent: [0],
      platformFee: [0],
      handlingFee: [0],

      // SURGE
      surgeEnabled: [false],
      surgeMultiplier: [1],
      surgeStart: [''],
      surgeEnd: [''],

      // VEHICLES
      bikeMultiplier: [1],
      carMultiplier: [1],
      vanMultiplier: [1],

      // EXTRAS
      insurancePercent: [0],
      codFee: [0],
    });
  }

  loadAdminAnalytics() {
    this.pricingService.getAdminAnalytics().subscribe({
      next: (res: any) => {
        this.adminAnalytics = res;
      },
      error: () => {
        this.adminAnalytics = null;
      },
    });
  }

  calculatePreview() {
    const base = Number(this.simulatedBase || 0);

    let price = base;

    // Margin
    const margin = this.form.value.marginPercent || 0;
    const marginAmount = (price * margin) / 100;
    const afterMargin = price + marginAmount;

    // Fees
    const fees =
      Number(this.form.value.platformFee || 0) +
      Number(this.form.value.handlingFee || 0);
    const afterFees = afterMargin + fees;

    // Vehicle
    const vehicleMultiplier = this.form.value.carMultiplier || 1;
    const vehicleImpact = afterFees * (vehicleMultiplier - 1);
    const afterVehicle = afterFees + vehicleImpact;

    // Surge
    const surgeMultiplier = this.form.value.surgeMultiplier || 1;
    const surgeImpact = this.form.value.surgeEnabled
      ? afterVehicle * (surgeMultiplier - 1)
      : 0;
    const afterSurge = afterVehicle + surgeImpact;

    // Extras
    const insurance =
      (afterSurge * Number(this.form.value.insurancePercent || 0)) / 100;

    const cod = Number(this.form.value.codFee || 0);

    const extrasImpact = insurance + cod;

    price = afterSurge + extrasImpact;

    this.simulatedResult = Math.round(price);

    // Chart (CORRECT FLOW)
    this.chartData = {
      labels: ['Base', 'Margin', 'Fees', 'Vehicle', 'Surge', 'Extras', 'Final'],
      datasets: [
        {
          data: [
            base,
            marginAmount,
            fees,
            vehicleImpact,
            surgeImpact,
            extrasImpact,
            this.simulatedResult,
          ],
        },
      ],
    };
  }

  onBaseChange(event: any) {
    this.simulatedBase = Number(event.target.value || 0);
    this.calculatePreview();
  }

  loadPricing() {
    this.isLoading = true;

    this.pricingService.getPricing().subscribe({
      next: (res: any) => {
        this.form.patchValue({
          marginPercent: res.marginPercent || 0,
          platformFee: res.baseFees?.platformFee || 0,
          handlingFee: res.baseFees?.handlingFee || 0,

          // SURGE
          surgeEnabled: res.surge?.enabled || false,
          surgeMultiplier: res.surge?.multiplier || 1,
          surgeStart: res.surge?.startTime || '',
          surgeEnd: res.surge?.endTime || '',

          // VEHICLES
          bikeMultiplier: this.getVehicle(res, 'bike'),
          carMultiplier: this.getVehicle(res, 'car'),
          vanMultiplier: this.getVehicle(res, 'van'),

          // EXTRAS
          insurancePercent: res.extras?.insurancePercent || 0,
          codFee: res.extras?.codFee || 0,
        });

        // IMPORTANT
        this.calculatePreview();

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getVehicle(res: any, type: string) {
    const v = res.vehicleOverrides?.find((x: any) => x.type === type);
    return v ? v.multiplier : 1;
  }

  save() {
    this.isSaving = true;

    const payload = {
      marginPercent: this.form.value.marginPercent,

      baseFees: {
        platformFee: this.form.value.platformFee,
        handlingFee: this.form.value.handlingFee,
      },

      // SURGE
      surge: {
        enabled: this.form.value.surgeEnabled,
        multiplier: this.form.value.surgeMultiplier,
        startTime: this.form.value.surgeStart,
        endTime: this.form.value.surgeEnd,
      },

      // VEHICLES
      vehicleOverrides: [
        { type: 'bike', multiplier: this.form.value.bikeMultiplier },
        { type: 'car', multiplier: this.form.value.carMultiplier },
        { type: 'van', multiplier: this.form.value.vanMultiplier },
      ],

      // EXTRAS
      extras: {
        insurancePercent: this.form.value.insurancePercent,
        codFee: this.form.value.codFee,
      },
    };

    if (this.form.value.surgeEnabled) {
      if (!this.form.value.surgeStart || !this.form.value.surgeEnd) {
        alert('Please set surge time range');
        this.isSaving = false;
        return;
      }

      if (this.form.value.surgeMultiplier <= 1) {
        alert('Surge multiplier must be greater than 1');
        this.isSaving = false;
        return;
      }
    }

    this.pricingService.updatePricing(payload).subscribe({
      next: () => {
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
