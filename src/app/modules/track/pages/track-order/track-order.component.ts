import { Component } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { OnInit } from '@angular/core';
import { SocketService } from '../../../../core/services/socket.service';
import { AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { APP_CONFIG } from 'src/environments/app.config';
import { getCurrencySymbol } from '../../../../core/utils/currency.util';
import { trigger, transition, style, animate } from '@angular/animations';
declare const google: any;

@Component({
  selector: 'app-track-order',
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate(
          '400ms ease',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class TrackOrderComponent implements OnInit, AfterViewInit {
  orderId = '';
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  currencySymbol = getCurrencySymbol();
  private socketListener: any;
  autoFollowCourier = true;
  routeBounds: any;
  timelineMap: Record<string, Date> = {};
  map: any;
  courierMarker: any;
  order: any = null;
  loading = false;
  error = '';
  directionsService: any;
  directionsRenderer: any;
  trackingInterval: any;
  pickupMarker: any;
  dropMarker: any;
  vehicleMap: Record<number, string> = {};
  previousLat: number | null = null;
  previousLng: number | null = null;
  animationInterval: any;
  etaText: string = '';
  distanceText: string = '';
  courier: any = null;
  courierLoading = false;
  statusSteps: string[] = [
    'CREATED',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
  ) {}

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.loadVehicleCatalog();

    this.route.queryParams.subscribe((params) => {
      this.orderId = params['orderId'] || params['id'] || '';

      if (this.orderId) {
        this.trackOrder();
      }
    });
  }

  loadVehicleCatalog() {
    this.api.get('/providers/vehicles').subscribe({
      next: (res: any) => {
        const vehicles = res?.data || [];
        this.vehicleMap = {};
        vehicles.forEach((v: any) => {
          this.vehicleMap[Number(v.id)] = v.name;
        });
      },
      error: (err) => {
        console.error('Failed to load vehicle catalog', err);
      },
    });
  }

  trackOrder() {
    if (!this.orderId?.trim()) {
      this.error = 'Please enter order ID';
      return;
    }

    this.loading = true;
    this.error = '';
    this.order = null;

    if (Object.keys(this.vehicleMap).length === 0) {
      this.loadVehicleCatalog();
    }

    this.api.get(`/orders/${this.orderId}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.order = res?.data;

        this.buildTimelineMap();
        this.startTrackingPolling();
        this.loadCourierInfo();

        setTimeout(() => {
          const pickupLat = Number(this.order?.pickup?.lat);
          const pickupLng = Number(this.order?.pickup?.lng);

          if (pickupLat && pickupLng && this.mapContainer) {
            this.initMap(pickupLat, pickupLng);
          }
        }, 200);

        if (this.order?.user) {
          this.socketService.connect(this.order.user);
        }

        this.socketListener = (data: any) => {
          if (data.orderId === this.order._id) {
            this.order.status = data.status;

            const exists = this.order.statusHistory.find(
              (s: any) => s.status === data.status,
            );

            if (!exists) {
              this.order.statusHistory.push({
                status: data.status,
                timestamp: new Date(),
              });

              this.buildTimelineMap();
            }

            this.startTrackingPolling();
          }
        };

        this.socketService.onOrderStatusUpdate(this.socketListener);

        if (!this.order) {
          this.error = 'Order not found';
        }
      },

      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Unable to fetch order. Please try again.';
      },
    });
  }

  buildTimelineMap() {
    this.timelineMap = {};

    if (!this.order?.statusHistory?.length) {
      return;
    }

    this.order.statusHistory.forEach((entry: any) => {
      if (entry.status && entry.timestamp) {
        this.timelineMap[entry.status] = new Date(entry.timestamp);
      }
    });
  }

  isPositive(value: any): boolean {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }

  formatAmount(value: any): string {
    const amount = Number(value);
    if (isNaN(amount)) return '0.00';
    return amount.toFixed(2);
  }

  calculateETA(courierLat: number, courierLng: number) {
    if (!this.order?.drop?.lat || !this.order?.drop?.lng) return;

    const dropLat = Number(this.order.drop.lat);
    const dropLng = Number(this.order.drop.lng);

    const service = this.directionsService;
    service.route(
      {
        origin: { lat: courierLat, lng: courierLng },
        destination: { lat: dropLat, lng: dropLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status !== 'OK') return;
        const leg = result.routes[0].legs[0];
        this.etaText = leg.duration.text;
        this.distanceText = leg.distance.text;
      },
    );
  }

  getBearing(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): number {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const endLatRad = (endLat * Math.PI) / 180;
    const endLngRad = (endLng * Math.PI) / 180;

    const dLng = endLngRad - startLngRad;
    const y = Math.sin(dLng) * Math.cos(endLatRad);
    const x =
      Math.cos(startLatRad) * Math.sin(endLatRad) -
      Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360;
    return bearing;
  }

  initMap(lat: number, lng: number) {
    if (!this.mapContainer?.nativeElement) return;

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 14,
      center: { lat, lng },
      gestureHandling: 'greedy',
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    this.map.addListener('dragstart', () => {
      this.autoFollowCourier = false;
    });

    this.directionsService = new google.maps.DirectionsService();

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#ff7a00',
        strokeWeight: 4,
        strokeOpacity: 0.85,
      },
    });

    this.directionsRenderer.setMap(this.map);
    this.addPickupDropMarkers();
  }

  addPickupDropMarkers() {
    if (!this.order) return;

    const pickupLat = Number(this.order.pickup?.lat);
    const pickupLng = Number(this.order.pickup?.lng);
    const dropLat = Number(this.order.drop?.lat);
    const dropLng = Number(this.order.drop?.lng);

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) return;

    this.pickupMarker = new google.maps.Marker({
      position: { lat: pickupLat, lng: pickupLng },
      map: this.map,
      icon: '/assets/icons/pickup-marker.svg',
    });

    this.dropMarker = new google.maps.Marker({
      position: { lat: dropLat, lng: dropLng },
      map: this.map,
      icon: '/assets/icons/drop-marker.svg',
    });

    this.drawRoute(pickupLat, pickupLng, dropLat, dropLng);
  }

  drawRoute(
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
  ) {
    this.directionsService.route(
      {
        origin: { lat: pickupLat, lng: pickupLng },
        destination: { lat: dropLat, lng: dropLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);

          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: pickupLat, lng: pickupLng });
          bounds.extend({ lat: dropLat, lng: dropLng });

          this.routeBounds = bounds;
          this.map.fitBounds(bounds);

          const leg = result.routes[0].legs[0];
          this.distanceText = leg.distance.text;
          this.etaText = leg.duration.text;
        }
      },
    );
  }

  updateCourierLocation(lat: number, lng: number) {
    if (!this.map) {
      this.initMap(lat, lng);
    }

    if (!this.courierMarker) {
      this.courierMarker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        icon: {
          url: '/assets/icons/courier-bike.svg',
          scaledSize: new google.maps.Size(40, 40),
        },
      });

      this.previousLat = lat;
      this.previousLng = lng;
      this.map.panTo({ lat, lng });
      return;
    }

    if (this.previousLat === lat && this.previousLng === lng) return;

    this.animateMarker(
      this.previousLat as number,
      this.previousLng as number,
      lat,
      lng,
    );
    this.calculateETA(lat, lng);

    this.previousLat = lat;
    this.previousLng = lng;
  }

  animateMarker(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) {
    if (this.animationInterval) clearInterval(this.animationInterval);

    const steps = 60;
    let step = 0;

    const deltaLat = (endLat - startLat) / steps;
    const deltaLng = (endLng - startLng) / steps;

    this.animationInterval = setInterval(() => {
      step++;

      const lat = startLat + deltaLat * step;
      const lng = startLng + deltaLng * step;
      const position = new google.maps.LatLng(lat, lng);

      this.courierMarker.setIcon({
        url: '/assets/icons/courier-bike.svg',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      });

      this.courierMarker.setPosition(position);

      if (this.autoFollowCourier) this.map.panTo(position);

      if (step >= steps) clearInterval(this.animationInterval);
    }, 80);
  }

  getVehicleLabel(): string {
    const vehicleType = this.order?.vehicle?.type;
    if (!vehicleType) return 'Courier Vehicle';
    return this.vehicleMap[vehicleType] || 'Courier Vehicle';
  }

  getEstimatedDuration(order: any): string {
    const points = order?.rawProviderResponse?.order?.points;
    if (!points || points.length < 2) return 'Calculating...';

    const pickup = points[0];
    const drop = points[1];
    if (!pickup?.latitude || !drop?.latitude) return 'Calculating...';

    const lat1 = Number(pickup.latitude);
    const lng1 = Number(pickup.longitude);
    const lat2 = Number(drop.latitude);
    const lng2 = Number(drop.longitude);

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const durationMinutes = Math.round((distance / 30) * 60);
    return durationMinutes + ' mins';
  }

  getEstimatedDistance(order: any): string {
    const points = order?.rawProviderResponse?.order?.points;
    if (!points || points.length < 2) return 'Calculating...';

    const pickup = points[0];
    const drop = points[1];
    if (!pickup?.latitude || !drop?.latitude) return 'Calculating...';

    const lat1 = Number(pickup.latitude);
    const lng1 = Number(pickup.longitude);
    const lat2 = Number(drop.latitude);
    const lng2 = Number(drop.longitude);

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance.toFixed(1) + ' km';
  }

  viewLiveTracking() {
    if (!this.order?._id) return;

    this.api.get(`/orders/${this.order._id}/tracking`).subscribe({
      next: (res: any) => {
        const points = res?.data?.points;
        if (!points?.length) return;

        const courierPoint = points.find((p: any) => p.delivery);

        if (!courierPoint?.latitude) {
          const pickupLat = Number(this.order.pickup?.lat);
          const pickupLng = Number(this.order.pickup?.lng);
          if (pickupLat && pickupLng) this.initMap(pickupLat, pickupLng);
          return;
        }

        const lat = Number(courierPoint.latitude);
        const lng = Number(courierPoint.longitude);
        this.updateCourierLocation(lat, lng);
        this.startTrackingPolling();
      },
      error: () => {
        console.error('Unable to fetch courier tracking');
      },
    });
  }

  startTrackingPolling() {
    if (this.order?.status === 'DELIVERED') {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      return;
    }

    if (
      this.order?.status !== 'PICKED_UP' &&
      this.order?.status !== 'IN_TRANSIT'
    ) {
      return;
    }

    if (this.trackingInterval) return;

    this.trackingInterval = setInterval(() => {
      if (!this.order?._id) return;

      this.api.get(`/orders/${this.order._id}/tracking`).subscribe({
        next: (res: any) => {
          const points = res?.data?.points;
          if (!points?.length) return;

          const courierPoint = points.find((p: any) => p.delivery);
          if (!courierPoint?.latitude) return;

          const lat = Number(courierPoint.latitude);
          const lng = Number(courierPoint.longitude);
          this.updateCourierLocation(lat, lng);
        },
      });
    }, APP_CONFIG.TRACKING_POLL_INTERVAL);
  }

  loadCourierInfo() {
    if (!this.order?._id) return;
    this.courierLoading = true;

    this.api.get(`/orders/${this.order._id}/courier`).subscribe({
      next: (res: any) => {
        this.courier = res?.data || null;
        this.courierLoading = false;
      },
      error: () => {
        this.courierLoading = false;
      },
    });
  }

  isStepDone(step: string): boolean {
    if (!this.order?.statusHistory?.length) return false;
    return this.order.statusHistory.some((s: any) => s.status === step);
  }

  getStepTimestamp(step: string): string {
    const date = this.timelineMap[step];
    if (!date) return 'Pending';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  resetTracking() {
    this.orderId = '';
    this.order = null;
    this.error = '';
    this.courier = null;
    this.etaText = '';
    this.distanceText = '';
    this.previousLat = null;
    this.previousLng = null;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.courierMarker) {
      this.courierMarker.setMap(null);
      this.courierMarker = null;
    }

    if (this.pickupMarker) {
      this.pickupMarker.setMap(null);
      this.pickupMarker = null;
    }

    if (this.dropMarker) {
      this.dropMarker.setMap(null);
      this.dropMarker = null;
    }

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }

    this.map = null;
  }

  ngOnDestroy(): void {
    if (this.trackingInterval) clearInterval(this.trackingInterval);
    if (this.animationInterval) clearInterval(this.animationInterval);
    if (this.socketListener) this.socketListener = null;
    this.socketService.disconnect();
  }
}
