import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  AdminDashboardService,
  AdminStats,
} from '../../services/admin-dashboard.service';
import { ChartConfiguration } from 'chart.js';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('statusChart', { static: false })
  chart!: BaseChartDirective;
  private destroy$ = new Subject<void>();
  stats: AdminStats | null = null;
  isLoading: boolean = true;
  lineChartData: ChartConfiguration<'line'>['data'] | null = null;
  selectedRange: 'today' | 'week' | 'month' = 'month';
  private requestId = 0;

  statusChartData: any = null;
  statusChartOptions: any = {
    responsive: true,

    onClick: (event: any, elements: any[]) => {
      if (!elements || elements.length === 0) return;

      const index = elements[0].index;

      const label = this.statusChartData?.labels?.[index];

      let selectedStatus = '';

      switch (label) {
        case 'Created':
          selectedStatus = 'CREATED';
          break;
        case 'In Progress':
          selectedStatus = 'IN_PROGRESS';
          break;
        case 'Delivered':
          selectedStatus = 'DELIVERED';
          break;
        case 'Cancelled':
          selectedStatus = 'CANCELLED';
          break;
        default:
          return;
      }

      console.log('Clicked:', selectedStatus);

      this.navigateToOrders(selectedStatus);
    },

    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  constructor(
    private dashboardService: AdminDashboardService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadStats();
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
    if (!statusCounts) return;

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
            '#6366f1', // keep aligned with your theme
            '#f59e0b',
            '#10b981',
            '#ef4444',
          ],
          borderWidth: 0,
        },
      ],
    };
  }

  // onStatusChartClick(active: any[]): void {
  //   if (!active || active.length === 0) return;

  //   const index = active[0].index;

  //   // Get label directly from chart data
  //   const label = this.statusChartData?.labels?.[index];

  //   let selectedStatus = '';

  //   switch (label) {
  //     case 'Created':
  //       selectedStatus = 'CREATED';
  //       break;
  //     case 'In Progress':
  //       selectedStatus = 'IN_PROGRESS';
  //       break;
  //     case 'Delivered':
  //       selectedStatus = 'DELIVERED';
  //       break;
  //     case 'Cancelled':
  //       selectedStatus = 'CANCELLED';
  //       break;
  //     default:
  //       return;
  //   }
  //   console.log('Clicked status:', selectedStatus);

  //   this.navigateToOrders(selectedStatus);
  // }

  // onChartClick(event: any): void {
  //   if (!this.chart || !this.chart.chart) return;
  //   const chart = this.chart.chart;

  //   const elements = chart.getElementsAtEventForMode(
  //     event,
  //     'nearest',
  //     { intersect: true },
  //     true,
  //   );
  //   console.log('chart ref:', this.chart);
  //   console.log('elements:', elements);
  //   if (!elements.length) return;

  //   const index = elements[0].index;

  //   const label = this.statusChartData?.labels?.[index];

  //   let selectedStatus = '';

  //   switch (label) {
  //     case 'Created':
  //       selectedStatus = 'CREATED';
  //       break;
  //     case 'In Progress':
  //       selectedStatus = 'IN_PROGRESS';
  //       break;
  //     case 'Delivered':
  //       selectedStatus = 'DELIVERED';
  //       break;
  //     case 'Cancelled':
  //       selectedStatus = 'CANCELLED';
  //       break;
  //     default:
  //       return;
  //   }

  //   console.log('Clicked:', selectedStatus);

  //   this.navigateToOrders(selectedStatus);
  // }

  navigateToOrders(status: string): void {
    this.router.navigate(['/admin/orders'], {
      queryParams: { status },
    });
  }

  updateChartData(sales: { month: string; value: number }[]): void {
    if (!sales || sales.length === 0) {
      this.lineChartData = null;
      return;
    }

    this.lineChartData = {
      labels: sales.map((s) => this.formatLabel(s.month)),
      datasets: [
        {
          data: sales.map((s) => s.value),
          label: 'Sales',
          fill: true,
          tension: 0.4,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  // formatLabel(label: string): string {
  //   const num = Number(label);

  //   if (this.selectedRange === 'today') {
  //     const hour = num;
  //     return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
  //   }
  //   if (this.selectedRange === 'week') {
  //     return new Date(
  //       new Date().getFullYear(),
  //       new Date().getMonth(),
  //       num,
  //     ).toLocaleDateString('en-US', { weekday: 'short' });
  //   }

  //   return label;
  // }

  formatLabel(label: string): string {
    if (!label) return '';

    if (this.selectedRange === 'today') {
      const num = Number(label);
      if (isNaN(num)) return label;
      return `${num % 12 || 12} ${num < 12 ? 'AM' : 'PM'}`;
    }

    if (this.selectedRange === 'week') {
      const num = Number(label);
      if (isNaN(num)) return label;

      return new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        num,
      ).toLocaleDateString('en-US', { weekday: 'short' });
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
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: function (value) {
            return Number(value).toLocaleString();
          },
        },
      },
    },
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
