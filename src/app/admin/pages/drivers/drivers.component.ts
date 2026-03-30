import { Component, OnInit } from '@angular/core';
import { AdminDriversService } from '../../services/admin-drivers.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
})
export class DriversComponent implements OnInit {
  drivers: any[] = [];
  loading: boolean = false;

  page: number = 1;
  limit: number = 10;
  total: number = 0;

  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  constructor(
    private driversService: AdminDriversService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadDrivers();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value: string) => {
        this.searchTerm = value;
        this.page = 1;
        this.loadDrivers();
      });
  }

  goToOrder(orderId: string) {
    if (!orderId) return;

    this.router.navigate(['/admin/orders'], {
      queryParams: { id: orderId },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ASSIGNED':
        return 'assigned';
      case 'PICKED_UP':
        return 'picked';
      case 'IN_TRANSIT':
        return 'transit';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'default';
    }
  }

  loadDrivers(): void {
    this.loading = true;

    this.driversService
      .getDrivers(this.page, this.limit, this.searchTerm)
      .subscribe({
        next: (res) => {
          this.drivers = res.data || [];
          this.total = res.pagination?.total || 0;
          this.loading = false;
        },
        error: () => {
          this.drivers = [];
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.page = page;
    this.loadDrivers();
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value.trim());
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }
}
