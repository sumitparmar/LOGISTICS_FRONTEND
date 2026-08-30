import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AdminDriversService } from '../../services/admin-drivers.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ViewChild, ElementRef } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { PermissionService } from '../../services/permission.service';
import { AdminSocketService } from '../../services/admin-socket.service';

declare const google: any;
@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
})
export class DriversComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  drivers: any[] = [];
  onboardingApplications: any[] = [];
  loading: boolean = false;
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  selectedDriver: any = null;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  errorMessage = '';
  onboardingLoading = false;
  onboardingError = '';
  onboardingPage = 1;
  onboardingLimit = 6;
  onboardingTotal = 0;
  onboardingStatus = 'ALL';
  updatingApplicationId: string | null = null;
  driverDetailsLoading = false;
  trackingError = '';
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
  private trackingStartTimeout: any = null;
  private trackingOrderId: string | null = null;

  private themeColor(token: string, fallback: string): string {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
      fallback
    );
  }

  private isGoogleMapsReady(): boolean {
    return typeof google !== 'undefined' && !!google.maps;
  }

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private driversService: AdminDriversService,
    public permissionService: PermissionService,
    private socketService: AdminSocketService,
  ) {}

  ngOnInit(): void {
    this.setupSearch();

    if (this.canReadDrivers()) this.loadDrivers();
    if (this.canReadOnboarding()) this.loadOnboardingApplications();

    this.socketService.orderUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.canReadDrivers()) this.loadDrivers();
      });

    this.socketService.driverOnboardingUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.canReadOnboarding()) this.loadOnboardingApplications();
      });
  }

  canReadDrivers(): boolean {
    return this.permissionService.has('drivers.read');
  }

  canReadOnboarding(): boolean {
    return this.permissionService.hasAny(['driver_onboarding.read', 'drivers.read']);
  }

  canUpdateOnboarding(): boolean {
    return this.permissionService.hasAny(['driver_onboarding.update', 'drivers.update']);
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.searchTerm = value.toLowerCase();
        this.page = 1;
        if (this.canReadDrivers()) this.loadDrivers();
        this.onboardingPage = 1;
        if (this.canReadOnboarding()) this.loadOnboardingApplications();
      });
  }

  goToOrder(orderId: string) {
    if (!this.permissionService.has('orders.read')) return;
    if (!orderId) return;

    this.router.navigate(['/admin/orders'], {
      queryParams: { id: orderId },
    });
  }

  loadDriverTracking(orderId: string) {
    this.clearTrackingPoller();
    this.trackingOrderId = orderId;
    this.trackingLoading = true;
    this.trackingError = '';

    this.api.get(`/admin/orders/${orderId}/tracking`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.trackingLoading = false;

        const courier = res?.data?.courier;
        const points = res?.data?.points || [];
        const courierPoint = points.find((p: any) => p.delivery);
        const lat = Number(courier?.latitude ?? courierPoint?.latitude);
        const lng = Number(courier?.longitude ?? courierPoint?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          this.trackingError = 'Live location is not available for this order yet.';
          this.cdr.markForCheck();
          return;
        }

        this.cdr.detectChanges();
        setTimeout(() => this.initMap(lat, lng));
      },
      error: (err) => {
        this.trackingLoading = false;
        this.trackingError = err?.error?.message || 'Unable to load live location.';
        this.cdr.markForCheck();
      },
    });

    this.startTracking(orderId);
  }

  startTracking(orderId: string) {
    this.clearTrackingPoller();
    this.trackingOrderId = orderId;

    this.trackingInterval = setInterval(() => {
      if (this.trackingOrderId !== orderId || !this.selectedDriver) return;

      this.api.get(`/admin/orders/${orderId}/tracking`).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (this.trackingOrderId !== orderId) return;
          const courier = res?.data?.courier;
          const points = res?.data?.points || [];
          const courierPoint = points.find((p: any) => p.delivery);
          const lat = Number(courier?.latitude ?? courierPoint?.latitude);
          const lng = Number(courier?.longitude ?? courierPoint?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          this.updateDriverLocation(lat, lng);
        },
      });
    }, 5000);
  }

  private clearTrackingPoller(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  loadDrivers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.driversService.getDrivers(this.page, this.limit, this.searchTerm).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.drivers = res.data || [];
        this.total = Number(res.pagination?.total || 0);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.drivers = [];
        this.total = 0;
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to load drivers right now.';
        this.cdr.markForCheck();
      },
    });
  }

  loadOnboardingApplications(): void {
    this.onboardingLoading = true;
    this.onboardingError = '';
    this.driversService
      .getOnboardingApplications(
        this.onboardingPage,
        this.onboardingLimit,
        this.searchTerm,
        this.onboardingStatus,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.onboardingApplications = res.data || [];
          this.onboardingTotal = Number(res.pagination?.total || 0);
          this.onboardingLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.onboardingApplications = [];
          this.onboardingTotal = 0;
          this.onboardingLoading = false;
          this.onboardingError = err?.error?.message || 'Unable to load applications right now.';
          this.cdr.markForCheck();
        },
      });
  }

  updateApplicationStatus(
    application: any,
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
  ): void {
    if (!this.canUpdateOnboarding()) return;
    if (!application?._id || this.updatingApplicationId) return;

    this.updatingApplicationId = application._id;

    this.driversService
      .updateOnboardingStatus(application._id, status, '', application.source)
      .subscribe({
        next: () => {
          this.updatingApplicationId = null;
          this.loadOnboardingApplications();
        },
        error: (err) => {
          this.updatingApplicationId = null;
          this.onboardingError = err?.error?.message || 'Unable to update this application.';
          this.cdr.markForCheck();
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

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.page = page;
    this.loadDrivers();
  }

  onLimitChange(limit: number): void {
    if (limit === this.limit) return;

    this.limit = limit;
    this.page = 1;
    this.loadDrivers();
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value.trim());
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  onOnboardingStatusChange(status: string): void {
    this.onboardingStatus = status;
    this.onboardingPage = 1;
    this.loadOnboardingApplications();
  }

  onOnboardingPageChange(page: number): void {
    this.onboardingPage = page;
    this.loadOnboardingApplications();
  }

  get onboardingTotalPages(): number {
    return Math.ceil(this.onboardingTotal / this.onboardingLimit) || 1;
  }

  initMap(lat: number, lng: number) {
    if (!this.mapContainer) return;
    if (!this.isGoogleMapsReady()) return;

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
          strokeColor: this.themeColor('--mk-secondary', '#2563eb'),
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
          fillColor: this.themeColor('--mk-secondary', '#2563eb'),
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
      this.drawRoute(this.currentPickup, this.currentDrop);
    }
  }

  drawRoute(pickup: any, drop: any) {
    if (!this.directionsService || !this.directionsRenderer) return;
    if (!this.isGoogleMapsReady()) return;

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
    if (!this.isGoogleMapsReady() || !google.maps.geometry?.spherical) {
      return 0;
    }

    return google.maps.geometry.spherical.computeHeading(start, end);
  }

  openDriver(driver: any) {
    this.closeDrawer();
    this.selectedDriver = driver;

    if (!driver?.id) {
      this.trackingError = 'Driver details are unavailable.';
      return;
    }

    this.driverDetailsLoading = true;
    this.driversService
      .getCourierOrders(driver.id, 1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!this.selectedDriver || this.selectedDriver.id !== driver.id) return;
          this.selectedDriver = { ...driver, orders: res.data || [] };
          this.driverDetailsLoading = false;
          this.cdr.markForCheck();
          this.prepareDriverTracking(this.selectedDriver);
        },
        error: () => {
          this.driverDetailsLoading = false;
          this.selectedDriver = { ...driver, orders: [] };
          this.trackingError = 'Unable to load this driver\'s orders.';
          this.cdr.markForCheck();
        },
      });
  }

  private prepareDriverTracking(driver: any): void {
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

    this.trackingStartTimeout = setTimeout(() => {
      this.trackingStartTimeout = null;
      if (!this.selectedDriver || this.selectedDriver.id !== driver.id) return;
      this.loadDriverTracking(activeOrder._id);
    }, 300);
  }

  updateDriverLocation(lat: number, lng: number) {
    if (!this.isGoogleMapsReady()) return;

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
    if (!this.isGoogleMapsReady()) return;

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

      if (!this.isGoogleMapsReady()) {
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
    if (!this.isGoogleMapsReady()) return;

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
    if (!this.courierMarker || !this.isGoogleMapsReady()) return;

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
    this.driverDetailsLoading = false;
    this.trackingOrderId = null;

    if (this.trackingStartTimeout) {
      clearTimeout(this.trackingStartTimeout);
      this.trackingStartTimeout = null;
    }

    this.clearTrackingPoller();
    this.clearAnimations();

    if (this.courierMarker) {
      this.courierMarker.setMap(null);
      this.courierMarker = null;
    }

    this.map = null;

    this.routePath = [];
    this.currentPickup = null;
    this.currentDrop = null;
    this.trackingError = '';
  }

  private clearAnimations(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.liveAnimationFrame) {
      cancelAnimationFrame(this.liveAnimationFrame);
      this.liveAnimationFrame = null;
    }

    this.targetPosition = null;
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
    if (!this.isGoogleMapsReady() || !google.maps.geometry?.spherical) return 0;

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

    if (this.trackingStartTimeout) {
      clearTimeout(this.trackingStartTimeout);
      this.trackingStartTimeout = null;
    }

    if (this.courierMarker) {
      this.courierMarker.setMap(null);
      this.courierMarker = null;
    }

    this.clearTrackingPoller();
    this.clearAnimations();
    this.map = null;
  }
}
