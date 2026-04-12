import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSocketService } from '../../services/admin-socket.service';
import { OrdersStore } from '../../services/admin-orders.store';
import {
  AdminDashboardService,
  AdminStats,
} from '../../services/admin-dashboard.service';
import { ChartConfiguration } from 'chart.js';

import { Subject, takeUntil } from 'rxjs';
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
            '#6366f1', // created
            '#f59e0b', // progress
            '#10b981', // delivered
            '#ef4444', // cancelled
          ],
          borderWidth: 0,
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

    this.lineChartData = {
      labels: sales.map((s, i) => this.formatLabel(s.label, i)),
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
