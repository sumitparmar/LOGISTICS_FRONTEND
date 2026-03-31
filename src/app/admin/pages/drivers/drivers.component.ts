import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { AdminDriversService } from '../../services/admin-drivers.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DriversStore } from '../../services/admin-drivers.store';
import { AdminOrdersService } from '../../services/admin-orders.service';
import { OrdersStore } from '../../services/admin-orders.store';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
})
export class DriversComponent implements OnInit {
  private destroy$ = new Subject<void>();
  drivers: any[] = [];
  loading: boolean = false;
  allDrivers: any[] = [];
  filteredDrivers: any[] = [];
  page: number = 1;
  limit: number = 10;
  total: number = 0;

  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  constructor(
    // private driversService: AdminDriversService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    // private driversStore: DriversStore,
    private ordersService: AdminOrdersService,
    private ordersStore: OrdersStore,
  ) {}

  ngOnInit(): void {
    console.log('Drivers INIT');

    this.setupSearch();

    this.loadOrdersForDrivers();

    this.ordersStore.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orders: any[]) => {
        const drivers = this.buildDrivers(orders);

        this.allDrivers = drivers;

        this.filteredDrivers = this.searchTerm
          ? drivers.filter(
              (d: any) =>
                d.name?.toLowerCase().includes(this.searchTerm) ||
                d.phone?.includes(this.searchTerm),
            )
          : drivers;

        this.total = this.filteredDrivers.length;

        this.applyPagination();
      });
  }

  private applyPagination(): void {
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;

    this.drivers = this.filteredDrivers.slice(start, end);
    this.cdr.detectChanges();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value: string) => {
        this.searchTerm = value.toLowerCase();
        this.page = 1;

        this.filteredDrivers = this.allDrivers.filter(
          (d: any) =>
            d.name?.toLowerCase().includes(this.searchTerm) ||
            d.phone?.includes(this.searchTerm),
        );

        this.total = this.filteredDrivers.length;
        this.applyPagination();

        this.cdr.detectChanges();
      });
  }

  goToOrder(orderId: string) {
    if (!orderId) return;

    this.router.navigate(['/admin/orders'], {
      queryParams: { id: orderId },
    });
  }

  private buildDrivers(orders: any[]): any[] {
    const map = new Map();

    orders.forEach((order) => {
      const c = order.courier;

      if (!c || !c.phone) return;

      const key = c.phone;

      if (!map.has(key)) {
        map.set(key, {
          name: `${c.name || ''} ${c.surname || ''}`.trim() || 'Unknown',
          phone: c.phone,
          photo: c.photoUrl,
          orders: [],
          activeOrders: 0,
          completedOrders: 0,
          lastOrderId: order._id,
          lastStatus: order.status,
        });
      }

      const driver = map.get(key);

      driver.orders.push(order);

      if (['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)) {
        driver.activeOrders++;
      }

      if (order.status === 'DELIVERED') {
        driver.completedOrders++;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.activeOrders - a.activeOrders,
    );
  }

  loadOrdersForDrivers(): void {
    console.log('🔥 Drivers → loading orders');

    this.ordersService.getOrders(1, 200).subscribe({
      next: (res: any) => {
        console.log('🔥 Orders loaded:', res.data);

        this.ordersStore.setOrders(res.data || []);
      },
      error: (err) => {
        console.error('Drivers load error:', err);
      },
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
    // No-op (now using reactive store)
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.page = page;

    this.applyPagination();
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value.trim());
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
