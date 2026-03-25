import { Component, OnInit } from '@angular/core';
import {
  AdminDashboardService,
  AdminStats,
} from '../../services/admin-dashboard.service';
import { ChartConfiguration } from 'chart.js';
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  isLoading: boolean = true;
  lineChartData: ChartConfiguration<'line'>['data'] | null = null;
  selectedRange: 'today' | 'week' | 'month' = 'month';

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.dashboardService.getStats(this.selectedRange).subscribe({
      next: (data) => {
        this.stats = data;
        this.updateChartData(data.sales);
        this.isLoading = false;
      },

      error: (err) => {
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

  updateChartData(
    sales: { label?: string; month?: string; value: number }[],
  ): void {
    if (!sales || sales.length === 0) {
      this.lineChartData = null;
      return;
    }

    this.lineChartData = {
      labels: sales.map((s) => this.formatLabel(s.label || s.month || '')),

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

  formatLabel(label: string): string {
    const num = Number(label);

    if (this.selectedRange === 'today') {
      const hour = num;
      return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
    }

    if (this.selectedRange === 'week') {
      const date = new Date();
      date.setDate(num);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
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
}
