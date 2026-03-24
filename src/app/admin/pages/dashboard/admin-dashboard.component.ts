import { Component, OnInit } from '@angular/core';
import {
  AdminDashboardService,
  AdminStats,
} from '../../services/admin-dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  stats!: AdminStats;

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe((data) => {
      this.stats = data;
    });
  }

  lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [100, 200, 150, 300, 250, 400],
        label: 'Sales',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };
}
