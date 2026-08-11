import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSocketService } from '../../services/admin-socket.service';
import { OrdersStore } from '../../services/admin-orders.store';
import {
  AdminDashboardService,
  AdminStats,
} from '../../services/admin-dashboard.service';
import { ChartConfiguration } from 'chart.js';

import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from 'src/app/core/services/theme.service';
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  stats: AdminStats | null = null;
  isLoading: boolean = true;
  lineChartData: ChartConfiguration<'line'>['data'] | null = null;
  selectedRange: 'today' | 'week' | 'month' = 'month';
  private requestId = 0;

  statusChartData: any = null;
  statusChartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  constructor(
    private dashboardService: AdminDashboardService,
    private socketService: AdminSocketService,
    private ordersStore: OrdersStore,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadStats();

    this.socketService.orderUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadStats();
      });

    this.socketService.userUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadStats();
      });

    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => this.applyChartTheme());
    });
  }

  loadStats(): void {
    const currentRequest = ++this.requestId;

    this.dashboardService
      .getStats(this.selectedRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // 🚨 Ignore old API responses
          if (currentRequest !== this.requestId) return;

          this.stats = data;
          this.updateChartData(data.sales);
          this.updateStatusChart(data.statusCounts);
          this.isLoading = false;
        },

        error: (err) => {
          if (currentRequest !== this.requestId) return;

          console.error('Dashboard load failed', err);
          this.isLoading = false;
        },
      });
  }

  changeRange(range: 'today' | 'week' | 'month') {
    if (this.selectedRange === range) return;

    this.selectedRange = range;
    this.isLoading = true;
    this.loadStats();
  }

  updateStatusChart(statusCounts: any): void {
    if (!statusCounts) {
      this.statusChartData = null;
      return;
    }

    const theme = this.chartTheme;

    this.statusChartData = {
      labels: ['Created', 'In Progress', 'Delivered', 'Cancelled'],
      datasets: [
        {
          data: [
            statusCounts.CREATED || 0,
            statusCounts.IN_PROGRESS || 0,
            statusCounts.DELIVERED || 0,
            statusCounts.CANCELLED || 0,
          ],
          backgroundColor: [
            theme.info,
            theme.warning,
            theme.success,
            theme.danger,
          ],
          borderColor: theme.surface,
          borderWidth: 2,
        },
      ],
    };
  }

  updateChartData(sales: { label: string; value: number }[]): void {
    if (!sales || sales.length === 0) {
      this.lineChartData = {
        labels: [],
        datasets: [
          {
            data: [],
            label: 'Sales',
          },
        ],
      };
      return;
    }

    const theme = this.chartTheme;

    this.lineChartData = {
      labels: sales.map((s, i) => this.formatLabel(s.label, i)),
      datasets: [
        {
          data: sales.map((s) => s.value),
          label: 'Sales',
          fill: true,
          tension: 0.4,
          borderColor: theme.info,
          backgroundColor: theme.infoSoft,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: theme.info,
          pointBorderColor: theme.surface,
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  onStatusChartClick(event: any): void {
    if (!event?.active?.length) return;

    const index = event.active[0].index;

    const statusMap = ['CREATED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
    const selectedStatus = statusMap[index];

    // navigation (safe)
    window.location.href = `/admin/orders?status=${selectedStatus}`;
  }

  // formatLabel(label: string, index?: number): string {
  //   if (!label) return '';

  //   const num = Number(label);

  //   // TODAY → hour → convert to AM/PM
  //   if (this.selectedRange === 'today') {
  //     if (isNaN(num)) return label;
  //     return `${num % 12 || 12} ${num < 12 ? 'AM' : 'PM'}`;
  //   }

  //   // WEEK → backend gives DATE → convert to weekday
  //   if (this.selectedRange === 'week') {
  //     const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  //     return weekLabels[index! % 7];
  //   }

  //   // MONTH → show date number clean
  //   if (this.selectedRange === 'month') {
  //     return num.toString();
  //   }

  //   return label;
  // }

  formatLabel(label: string, index?: number): string {
    if (!label) return '';

    const num = Number(label);

    // TODAY → hour → convert to AM/PM
    if (this.selectedRange === 'today') {
      if (isNaN(num)) return label;
      return `${num % 12 || 12} ${num < 12 ? 'AM' : 'PM'}`;
    }

    // WEEK → FIXED LABELS (NO DATE CALCULATION)
    if (this.selectedRange === 'week') {
      const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return weekLabels[index! % 7];
    }

    // MONTH → show date number
    if (this.selectedRange === 'month') {
      return num.toString();
    }

    return label;
  }

  getComparisonText(): string {
    if (this.selectedRange === 'today') return 'from yesterday';
    if (this.selectedRange === 'week') return 'from last week';
    return 'from last month';
  }

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: this.chartTheme.textSecondary,
          callback: function (value) {
            return String(value);
          },
        },
      },
      y: {
        grid: { color: this.chartTheme.border },
        ticks: {
          color: this.chartTheme.textSecondary,
          callback: function (value) {
            return Number(value).toLocaleString();
          },
        },
      },
    },
  };

  private get chartTheme() {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;

    return {
      surface: token('--mk-card-bg', '#ffffff'),
      textSecondary: token('--mk-text-secondary', '#64748b'),
      border: token('--mk-border', '#e5e7eb'),
      info: token('--mk-info', '#2563eb'),
      infoSoft: token('--mk-info-soft', 'rgba(37, 99, 235, 0.14)'),
      warning: token('--mk-warning', '#ea580c'),
      success: token('--mk-success', '#16a34a'),
      danger: token('--mk-danger', '#dc2626'),
    };
  }

  private applyChartTheme(): void {
    const theme = this.chartTheme;

    if (this.lineChartData?.datasets?.length) {
      this.lineChartData = {
        ...this.lineChartData,
        datasets: this.lineChartData.datasets.map((dataset) => ({
          ...dataset,
          borderColor: theme.info,
          backgroundColor: theme.infoSoft,
          pointBackgroundColor: theme.info,
          pointBorderColor: theme.surface,
        })),
      };
    }

    if (this.statusChartData?.datasets?.length) {
      this.statusChartData = {
        ...this.statusChartData,
        datasets: this.statusChartData.datasets.map((dataset: any) => ({
          ...dataset,
          backgroundColor: [
            theme.info,
            theme.warning,
            theme.success,
            theme.danger,
          ],
          borderColor: theme.surface,
        })),
      };
    }

    this.lineChartOptions = {
      ...this.lineChartOptions,
      scales: {
        ...this.lineChartOptions?.scales,
        x: {
          ...this.lineChartOptions?.scales?.['x'],
          ticks: {
            ...this.lineChartOptions?.scales?.['x']?.ticks,
            color: theme.textSecondary,
          },
        },
        y: {
          ...this.lineChartOptions?.scales?.['y'],
          grid: {
            ...this.lineChartOptions?.scales?.['y']?.grid,
            color: theme.border,
          },
          ticks: {
            ...this.lineChartOptions?.scales?.['y']?.ticks,
            color: theme.textSecondary,
          },
        },
      },
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
