import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../../services/dashboard.service';
interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  walletBalance: number;
}

interface RecentOrder {
  id: string;
  drop: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(private dashboardService: DashboardService) {}

  dashboardStats: DashboardStats = {
    totalOrders: 0,
    activeOrders: 0,
    walletBalance: 0,
  };

  recentOrders: RecentOrder[] = [];

  showAllOrders = false;
  visibleOrdersCount = 3;
  isLoading = false;

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;

    this.dashboardService.getSummary().subscribe({
      next: (response: any) => {
        const data = response.data;

        this.dashboardStats = {
          totalOrders: data.totalOrders,
          activeOrders: data.activeOrders,
          walletBalance: data.walletBalance,
        };

        this.recentOrders = data.recentOrders.map((order: any) => ({
          id: order.id,
          drop: order.drop,
          time: this.formatDate(order.createdAt),
        }));

        this.visibleOrdersCount = 3;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Dashboard load failed', error);
        this.isLoading = false;
      },
    });
  }

  toggleRecentOrders(): void {
    this.showAllOrders = !this.showAllOrders;
    this.visibleOrdersCount = this.showAllOrders ? this.recentOrders.length : 3;
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
