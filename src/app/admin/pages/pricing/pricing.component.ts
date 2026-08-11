import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminPricingService } from '../../services/admin-pricing.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ViewChild } from '@angular/core';
import { AdminOrdersService } from '../../services/admin-orders.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { AdminSocketService } from '../../services/admin-socket.service';
@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
})
export class PricingComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  destroy$ = new Subject<void>();
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  simulatedBase = 100;
  simulatedResult = 100;
  adminAnalytics: any;
  chartData: any = null;
  selectedRange = 'month';
  isExporting: boolean = false;
  revenueChartData: any;
  vehicleChartData: any;

  showConfirm: boolean = false;
  confirmMode: 'export' | null = null;

  constructor(
    private fb: FormBuilder,
    private pricingService: AdminPricingService,
    private ordersService: AdminOrdersService,
    private toastService: ToastService,
    private themeService: ThemeService,
    private socketService: AdminSocketService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPricing();
    this.loadAdminAnalytics();
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculatePreview();
    });
    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => this.applyChartTheme());
    });
    this.socketService.pricingUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPricing();
        this.loadAdminAnalytics();
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

      // TAX
      gstEnabled: [true],
      gstPercent: [18],
    });
  }

  loadAdminAnalytics() {
    this.pricingService.getAdminAnalytics(this.selectedRange).subscribe({
      next: (res: any) => {
        const data = res?.data || {};

        this.adminAnalytics = data;
        this.prepareCharts(data);
      },
      error: () => {
        this.adminAnalytics = null;
      },
    });
  }

  changeRange(range: string) {
    this.selectedRange = range;
    this.loadAdminAnalytics();
  }

  prepareCharts(data: any) {
    const vehicles = data?.vehicleBreakdown || [];
    const trend = data?.revenueTrend || [];
    const theme = this.chartTheme;

    if (!trend.length) {
      this.revenueChartData = null;
    }

    if (!vehicles.length) {
      this.vehicleChartData = null;
    }

    this.vehicleChartData = {
      labels: vehicles.map((v: any) => v.type),
      datasets: [
        {
          label: 'Revenue by Vehicle (₹)',
          data: vehicles.map((v: any) => v.revenue),
        },
      ],
    };

    const hasSinglePoint = trend.length === 1;

    this.revenueChartData = {
      labels: hasSinglePoint
        ? [trend[0].label, '']
        : trend.map((r: any) => r.label),

      datasets: [
        {
          data: hasSinglePoint
            ? [trend[0].revenue, trend[0].revenue]
            : trend.map((r: any) => r.revenue),

          label: 'Revenue (₹)',
          borderColor: theme.danger,
          backgroundColor: theme.dangerSoft,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    };
    setTimeout(() => {
      this.chart?.update();
    }, 0);
  }

  // mapVehicle(type: string) {
  //   const map: any = {
  //     '1': 'Bike',
  //     '2': 'Car',
  //     '3': 'Van',
  //     '8': 'Auto', // adjust if needed
  //   };

  //   return map[type] || type;
  // }

  formatCurrency(value: number): string {
    if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr';
    if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
    if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + 'K';
    return '₹' + value;
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

    // Tax
    const gstPercent = this.form.value.gstEnabled
      ? Number(this.form.value.gstPercent || 0)
      : 0;
    const taxImpact = (afterSurge * gstPercent) / 100;

    price = afterSurge + taxImpact;

    this.simulatedResult = Math.round(price);

    this.chartData = null;

    this.chartData = {
      labels: ['Base', 'Margin', 'Fees', 'Vehicle', 'Surge', 'GST', 'Final'],
      datasets: [
        {
          label: 'Price Breakdown',
          data: [
            base,
            marginAmount,
            fees,
            vehicleImpact,
            surgeImpact,
            taxImpact,
            this.simulatedResult,
          ],
          borderColor: this.chartTheme.danger,
          backgroundColor: this.chartTheme.dangerSoft,
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  onBaseChange(event: any) {
    this.simulatedBase = Number(event.target.value || 0);
    this.calculatePreview();
  }

  chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: 'index' as const,
      intersect: false,
    },

    plugins: {
      legend: {
        display: true,
        labels: {
          font: {
            size: 12,
            weight: '500',
          },
          color: this.chartTheme.textSecondary,
        },
      },

      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0;
            return ' ' + this.formatCurrency(value);
          },
        },
      },
    },

    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
        },
        grid: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatCurrency(Number(value)),
        },
        grid: {
          color: this.chartTheme.border,
        },
      },
    },
  };

  private get chartTheme() {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;

    return {
      danger: token('--mk-danger', '#dc2626'),
      dangerSoft: token('--mk-danger-soft', 'rgba(220, 38, 38, 0.14)'),
      textSecondary: token('--mk-text-secondary', '#64748b'),
      border: token('--mk-border', 'rgba(148, 163, 184, 0.22)'),
    };
  }

  private applyChartTheme(): void {
    const theme = this.chartTheme;
    const rethemeDataset = (dataset: any) => ({
      ...dataset,
      borderColor: theme.danger,
      backgroundColor: theme.dangerSoft,
    });

    if (this.chartData?.datasets?.length) {
      this.chartData = {
        ...this.chartData,
        datasets: this.chartData.datasets.map(rethemeDataset),
      };
    }

    if (this.revenueChartData?.datasets?.length) {
      this.revenueChartData = {
        ...this.revenueChartData,
        datasets: this.revenueChartData.datasets.map(rethemeDataset),
      };
    }

    this.chartOptions = {
      ...this.chartOptions,
      plugins: {
        ...this.chartOptions.plugins,
        legend: {
          ...this.chartOptions.plugins?.legend,
          labels: {
            ...this.chartOptions.plugins?.legend?.labels,
            color: theme.textSecondary,
          },
        },
      },
      scales: {
        ...this.chartOptions.scales,
        x: {
          ...this.chartOptions.scales?.['x'],
          ticks: {
            ...this.chartOptions.scales?.['x']?.ticks,
            color: theme.textSecondary,
          },
        },
        y: {
          ...this.chartOptions.scales?.['y'],
          grid: {
            ...this.chartOptions.scales?.['y']?.grid,
            color: theme.border,
          },
          ticks: {
            ...this.chartOptions.scales?.['y']?.ticks,
            color: theme.textSecondary,
          },
        },
      },
    };

    setTimeout(() => this.chart?.update(), 0);
  }

  exportPricingCSV(): void {
    if (this.isExporting) return;

    this.isExporting = true;

    const params: any = {
      type: 'pricing',
      range: 'month', // or dynamic
    };

    this.ordersService.exportCSV(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'pricing-export.csv';
        a.click();

        window.URL.revokeObjectURL(url);

        this.isExporting = false;
        this.showConfirm = false;
        this.toastService.show('Pricing exported successfully', 'success');
      },
      error: () => {
        this.isExporting = false;
        this.showConfirm = false;
        this.toastService.show('Export failed', 'error');
      },
    });
  }

  confirmExport(): void {
    this.confirmMode = 'export';
    this.showConfirm = true;
  }

  onConfirmAction(): void {
    if (this.confirmMode === 'export') {
      this.exportPricingCSV();
    }
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
          bikeMultiplier: this.getVehicle(res, '1'),
          carMultiplier: this.getVehicle(res, '2'),
          vanMultiplier: this.getVehicle(res, '3'),
          gstEnabled: res.tax?.gstEnabled !== false,
          gstPercent: res.tax?.gstPercent ?? 18,
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
        { type: '1', multiplier: this.form.value.bikeMultiplier },
        { type: '2', multiplier: this.form.value.carMultiplier },
        { type: '3', multiplier: this.form.value.vanMultiplier },
      ],

      tax: {
        gstEnabled: this.form.value.gstEnabled,
        gstPercent: Number(this.form.value.gstPercent || 0),
      },
    };

    if (this.form.value.surgeEnabled) {
      if (!this.form.value.surgeStart || !this.form.value.surgeEnd) {
        this.toastService.warning('Please set surge time range');
        this.isSaving = false;
        return;
      }

      if (this.form.value.surgeMultiplier <= 1) {
        this.toastService.warning('Surge multiplier must be greater than 1');
        this.isSaving = false;
        return;
      }
    }

    if (payload.tax.gstEnabled && payload.tax.gstPercent < 0) {
      this.toastService.warning('GST percentage cannot be negative');
      this.isSaving = false;
      return;
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
