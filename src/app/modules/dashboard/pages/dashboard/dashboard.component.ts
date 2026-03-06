import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../../services/dashboard.service';
import { Router } from '@angular/router';
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

interface DashboardResponse {
  data: {
    totalOrders: number;
    activeOrders: number;
    walletBalance: number;
    recentOrders: {
      id: string;
      drop: string;
      createdAt: string;
    }[];
  };
}
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private dashboardService: DashboardService,
    private router: Router,
  ) {}

  dashboardStats: DashboardStats = {
    totalOrders: 0,
    activeOrders: 0,
    walletBalance: 0,
  };

  recentOrders: RecentOrder[] = [];

  showAllOrders = false;
  visibleOrdersCount = 3;
  isLoading = false;
  hasError = false;

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;

    this.dashboardService.getSummary().subscribe({
      next: (response: DashboardResponse) => {
        if (!response?.data) {
          this.hasError = true;
          this.isLoading = false;
          return;
        }

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
        this.hasError = false;
      },
      error: (error: unknown) => {
        console.error('Dashboard load failed', error);
        this.hasError = true;
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
  goToAllOrders(): void {
    this.router.navigate(['/app/orders']);
  }

  goToActiveOrders(): void {
    this.router.navigate(['/app/orders'], {
      queryParams: { status: 'ACTIVE' },
    });
  }

  goToWallet(): void {
    this.router.navigate(['/app/wallet']);
  }

  goToOrder(id: string): void {
    this.router.navigate(['/app/orders', id]);
  }
  trackByOrder(index: number, order: RecentOrder): string {
    return order.id;
  }

  goToBookDelivery(): void {
    this.router.navigate(['/app/delivery/create']);
  }
}
