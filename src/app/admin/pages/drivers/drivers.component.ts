import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { AdminDriversService } from '../../services/admin-drivers.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DriversStore } from '../../services/admin-drivers.store';
import { AdminOrdersService } from '../../services/admin-orders.service';
import { OrdersStore } from '../../services/admin-orders.store';
import { takeUntil } from 'rxjs/operators';
import { ViewChild, ElementRef } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
declare const google: any;
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
  selectedDriver: any = null;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  map: any;
  courierMarker: any;
  trackingLoading = false;
  trackingInterval: any;
  directionsService: any;
  directionsRenderer: any;
  currentPickup: any = null;
  currentDrop: any = null;
  routePath: any[] = [];
  animationInterval: any = null;
  private targetPosition: any = null;
  private liveAnimationFrame: any = null;

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  constructor(
    private api: ApiService,
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

          location: c.location || null,
        });
      }

      const driver = map.get(key);
      if (c.location) {
        driver.location = c.location;
      }
      driver.orders.push(order);

      if (['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)) {
        driver.activeOrders++;
      }

      if (order.status === 'DELIVERED') {
        driver.completedOrders++;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.activeOrders !== a.activeOrders) {
        return b.activeOrders - a.activeOrders;
      }
      return b.completedOrders - a.completedOrders;
    });
  }

  loadDriverTracking(orderId: string) {
    this.trackingLoading = true;

    this.api.get(`/orders/${orderId}/tracking`).subscribe({
      next: (res: any) => {
        this.trackingLoading = false;

        const points = res?.data?.points;
        if (!points?.length) return;

        const courierPoint = points.find((p: any) => p.delivery);
        if (!courierPoint?.latitude) return;

        const lat = Number(courierPoint.latitude);
        const lng = Number(courierPoint.longitude);

        this.initMap(lat, lng);
      },
      error: () => {
        this.trackingLoading = false;
      },
    });

    this.startTracking(orderId);
  }

  startTracking(orderId: string) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    this.trackingInterval = setInterval(() => {
      this.api.get(`/orders/${orderId}/tracking`).subscribe({
        next: (res: any) => {
          const points = res?.data?.points;
          if (!points?.length) return;

          const courierPoint = points.find((p: any) => p.delivery);
          if (!courierPoint?.latitude) return;

          const lat = Number(courierPoint.latitude);
          const lng = Number(courierPoint.longitude);

          console.log('TRACKING UPDATE:', lat, lng);

          this.updateDriverLocation(lat, lng);
        },
      });
    }, 5000);
  }

  loadOrdersForDrivers(): void {
    this.ordersService.getOrders(1, 1000).subscribe({
      next: (res: any) => {
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

  initMap(lat: number, lng: number) {
    if (!this.mapContainer) return;

    if (!this.map) {
      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        zoom: 14,
        center: { lat, lng },
        gestureHandling: 'greedy',
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      });
    } else {
      this.map.setCenter({ lat, lng });
    }

    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }

    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 4,
        },
      });

      this.directionsRenderer.setMap(this.map);
    }

    if (!this.courierMarker) {
      this.courierMarker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        icon: {
          path: 'M12 2C8 2 4 6 4 10c0 3 2 6 5 7l-1 3h2l1-2h2l1 2h2l-1-3c3-1 5-4 5-7 0-4-4-8-8-8zm0 2c3 0 6 3 6 6 0 2-1 4-3 5l-1-2h-4l-1 2c-2-1-3-3-3-5 0-3 3-6 6-6z',
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 1.5,
          rotation: 0,
          anchor: new google.maps.Point(12, 12),
        },
      });
    } else {
      this.courierMarker.setPosition({ lat, lng });
    }

    if (this.currentPickup && this.currentDrop && !this.routePath.length) {
      console.log('Drawing route after map init');

      this.drawRoute(this.currentPickup, this.currentDrop);
    }
  }

  drawRoute(pickup: any, drop: any) {
    if (!this.directionsService || !this.directionsRenderer) return;

    this.directionsService.route(
      {
        origin: pickup,
        destination: drop,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);

          // ✅ store route path for animation
          const route = result.routes[0].overview_path;
          this.routePath = route;
        } else {
          console.error('Route failed:', status);
        }
      },
    );
  }

  getHeading(start: any, end: any): number {
    return google.maps.geometry.spherical.computeHeading(start, end);
  }
  // openDriver(driver: any) {
  //   this.selectedDriver = driver;

  //   const activeOrder = this.getActiveOrders(driver)[0];
  //   console.log('ACTIVE ORDER:', activeOrder);
  //   if (activeOrder?.pickup && activeOrder?.drop) {
  //     const pickup = {
  //       lat: activeOrder.pickup.latitude,
  //       lng: activeOrder.pickup.longitude,
  //     };

  //     const drop = {
  //       lat: activeOrder.drop.latitude,
  //       lng: activeOrder.drop.longitude,
  //     };

  //     this.drawRoute(pickup, drop);
  //   }

  //   if (!activeOrder?._id) return;

  //   setTimeout(() => {
  //     this.loadDriverTracking(activeOrder._id);
  //   }, 300);
  // }

  openDriver(driver: any) {
    this.selectedDriver = driver;

    const activeOrder = this.getActiveOrders(driver)[0];
    if (!activeOrder) return;

    let pickup: any = null;
    let drop: any = null;

    // PICKUP extraction
    if (activeOrder.pickup?.lat && activeOrder.pickup?.lng) {
      pickup = activeOrder.pickup;
    } else if (activeOrder.pickup?.location?.lat) {
      pickup = activeOrder.pickup.location;
    } else if (activeOrder.pickup?.coordinates?.length === 2) {
      pickup = {
        lat: activeOrder.pickup.coordinates[1],
        lng: activeOrder.pickup.coordinates[0],
      };
    }

    // DROP extraction
    if (activeOrder.drop?.lat && activeOrder.drop?.lng) {
      drop = activeOrder.drop;
    } else if (activeOrder.drop?.location?.lat) {
      drop = activeOrder.drop.location;
    } else if (activeOrder.drop?.coordinates?.length === 2) {
      drop = {
        lat: activeOrder.drop.coordinates[1],
        lng: activeOrder.drop.coordinates[0],
      };
    }

    // Draw route only if valid
    if (pickup && drop) {
      this.currentPickup = pickup;
      this.currentDrop = drop;
    } else {
      console.warn('Route data missing in order:', activeOrder);
    }

    // start tracking (existing logic)
    setTimeout(() => {
      this.loadDriverTracking(activeOrder._id);
    }, 300);
  }

  updateDriverLocation(lat: number, lng: number) {
    // map not ready → initialize
    if (!this.map) {
      this.initMap(lat, lng);
      return;
    }

    if (!this.courierMarker) return;

    const newPosition = new google.maps.LatLng(lat, lng);
    const oldPosition = this.courierMarker.getPosition();

    // 🚫 ignore duplicate coordinates
    if (oldPosition && oldPosition.lat() === lat && oldPosition.lng() === lng) {
      return;
    }

    // first time set
    if (!oldPosition) {
      this.courierMarker.setPosition(newPosition);
      return;
    }

    // 🚨 ROUTE NOT READY → fallback to direct movement
    if (!this.routePath.length) {
      if (!this.animationInterval) {
        this.animateMarker(oldPosition, newPosition);
      }
      return;
    }

    // 🚨 ROUTE-BASED MOVEMENT
    const nearestIndex = this.findNearestRouteIndex(newPosition);

    // next point on route
    const STEP = 5; // move 5 points ahead (tweakable)

    const nextPoint = this.routePath[nearestIndex + STEP] || newPosition;
    // animate safely
    // set target position (do not animate immediately)
    this.targetPosition = nextPoint;

    // start continuous movement loop if not already running
    if (!this.liveAnimationFrame) {
      this.startContinuousMovement();
    }
  }

  startContinuousMovement() {
    const speed = 0.00005; // tweak if needed

    const move = () => {
      if (!this.courierMarker || !this.targetPosition) {
        this.liveAnimationFrame = null;
        return;
      }

      const current = this.courierMarker.getPosition();

      if (!current) {
        this.liveAnimationFrame = null;
        return;
      }

      const latDiff = this.targetPosition.lat() - current.lat();
      const lngDiff = this.targetPosition.lng() - current.lng();

      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      // if very close → stop
      if (distance < 0.00001) {
        this.liveAnimationFrame = null;
        return;
      }

      const nextLat = current.lat() + latDiff * speed;
      const nextLng = current.lng() + lngDiff * speed;

      const nextPos = new google.maps.LatLng(nextLat, nextLng);

      // rotation (stable)
      const heading = this.getHeading(current, this.targetPosition);
      const icon = this.courierMarker.getIcon();

      if (!icon.rotation || Math.abs(icon.rotation - heading) > 5) {
        icon.rotation = heading;
        this.courierMarker.setIcon(icon);
      }

      this.courierMarker.setPosition(nextPos);

      this.liveAnimationFrame = requestAnimationFrame(move);
    };

    this.liveAnimationFrame = requestAnimationFrame(move);
  }

  updateLiveRoute(driverLat: number, driverLng: number, drop: any) {
    if (!this.directionsService || !this.directionsRenderer) return;

    const origin = { lat: driverLat, lng: driverLng };
    const destination = drop;

    this.directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);
        } else {
          console.error('Live route failed:', status);
        }
      },
    );
  }

  animateMarker(start: any, end: any) {
    const duration = 1000;
    const frames = 60;
    let frame = 0;

    const deltaLat = (end.lat() - start.lat()) / frames;
    const deltaLng = (end.lng() - start.lng()) / frames;

    this.animationInterval = setInterval(() => {
      frame++;
      const progress = frame / frames;

      // ease-in-out (smooth like Zomato)
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = start.lat() + deltaLat * frames * ease;
      const lng = start.lng() + deltaLng * frames * ease;

      const position = new google.maps.LatLng(lat, lng);

      const heading = this.getHeading(start, end);
      const icon = { ...this.courierMarker.getIcon() };
      // update rotation only if change is meaningful
      if (!icon.rotation || Math.abs(icon.rotation - heading) > 5) {
        icon.rotation = heading;
        this.courierMarker.setIcon(icon);
      }

      this.courierMarker.setPosition(position);

      if (frame >= frames) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }, duration / frames);
  }

  closeDrawer() {
    this.selectedDriver = null;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.courierMarker) {
      this.courierMarker.setMap(null);
      this.courierMarker = null;
    }

    this.map = null;

    this.routePath = [];
    this.currentPickup = null;
    this.currentDrop = null;
  }

  getActiveOrders(driver: any) {
    return (
      driver.orders?.filter((o: any) =>
        ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status),
      ) || []
    );
  }

  getCompletedOrders(driver: any) {
    return driver.orders?.filter((o: any) => o.status === 'DELIVERED') || [];
  }

  findNearestRouteIndex(position: any): number {
    if (!this.routePath?.length) return 0;

    let minDist = Infinity;
    let nearestIndex = 0;

    this.routePath.forEach((point: any, index: number) => {
      const dist = google.maps.geometry.spherical.computeDistanceBetween(
        position,
        point,
      );

      if (dist < minDist) {
        minDist = dist;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.courierMarker) {
      this.courierMarker.setMap(null);
      this.courierMarker = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.map = null;
  }
}
