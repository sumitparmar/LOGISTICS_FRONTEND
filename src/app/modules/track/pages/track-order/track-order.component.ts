import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketService } from '../../../../core/services/socket.service';
import { APP_CONFIG } from 'src/environments/app.config';
import { getCurrencySymbol } from '../../../../core/utils/currency.util';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
declare const google: any;

@Component({
  selector: 'app-track-order',
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.scss'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '350ms cubic-bezier(.4,0,.2,1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class TrackOrderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  orderId = '';
  order: any = null;
  courier: any = null;
  loading = false;
  error = '';
  etaText = '';
  distanceText = '';
  currencySymbol = getCurrencySymbol();
  mapsUnavailable = false;
  trackingLastUpdated: Date | null = null;
  liveTrackingMessage = 'Waiting for courier location';

  private map: any;
  private directionsService: any;
  private directionsRenderer: any;
  private liveDirectionsRenderer: any;
  private pickupMarker: any;
  private dropMarker: any;
  private courierMarker: any;
  private courierInfoWindow: any;
  private pickupInfoWindow: any;
  private dropInfoWindow: any;
  private trackingInterval: any;
  private summaryInterval: any;
  private animationInterval: any;
  private socketListener: any;
  private routeBounds: any;
  private routeSub: Subscription | null = null;
  private previousLat: number | null = null;
  private previousLng: number | null = null;

  private themeColor(token: string, fallback: string): string {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
      fallback
    );
  }

  private isGoogleMapsReady(): boolean {
    return typeof google !== 'undefined' && !!google.maps;
  }

  autoFollowCourier = true;
  timelineMap: Record<string, Date> = {};
  vehicleMap: Record<number, string> = {};

  statusSteps = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

  // ─── Status label map (Borzo order statuses → human readable) ───────────
  private statusLabels: Record<string, string> = {
    CREATED: 'Order Created',
    ASSIGNED: 'Courier Assigned',
    PICKED_UP: 'Parcel Picked Up',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private socket: SocketService,
  ) {}

  private hasAuthToken(): boolean {
    return !!localStorage.getItem('LOGISTICS_TOKEN');
  }

  ngOnInit(): void {
    this.loadVehicleCatalog();
    this.routeSub = this.route.queryParams.subscribe((p) => {
      this.orderId = p['orderId'] || p['id'] || '';

      if (this.orderId) {
        this.trackOrder();
      }
    });
  }

  ngAfterViewInit(): void {}

  // ─── Vehicle catalog ────────────────────────────────────────────────────
  loadVehicleCatalog(): void {
    this.api.get('/providers/vehicles').subscribe({
      next: (res: any) => {
        const vehicles = res?.data || [];
        this.vehicleMap = {};
        vehicles.forEach((v: any) => {
          this.vehicleMap[Number(v.id)] = v.name;
        });
      },
      error: (err) => console.error('Vehicle catalog failed', err),
    });
  }

  // ─── Track ──────────────────────────────────────────────────────────────
  trackOrder(): void {
    if (!this.orderId?.trim()) {
      this.error = 'Please enter a valid Order ID';
      return;
    }

    this.loading = true;
    this.error = '';
    this.order = null;

    const endpoint = this.hasAuthToken()
      ? `/orders/${this.orderId}`
      : `/orders/track/${this.orderId}`;

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.order = res?.data;

        if (!this.order) {
          this.error = 'Order not found';
          return;
        }

        this.buildTimelineMap();
        if (this.hasAuthToken()) {
          this.loadCourierInfo();
          this.startTrackingPolling();
        } else {
          this.courier = this.normalizeCourier(this.order?.courier);
        }

        this.connectRealtime();
        this.startPublicTrackingPolling();

        this.socketListener = (data: any) => {
          if (data.orderId !== this.order._id) return;
          this.order.status = data.status;
          if (data.courier) {
            this.courier = this.normalizeCourier(data.courier);
            const lat = this.courier?.latitude;
            const lng = this.courier?.longitude;
            if (lat && lng) this.updateCourierLocation(lat, lng);
          }
          if (
            !this.order.statusHistory.find((s: any) => s.status === data.status)
          ) {
            this.order.statusHistory.push({
              status: data.status,
              timestamp: new Date(),
            });
            this.buildTimelineMap();
          }
          if (this.hasAuthToken()) this.startTrackingPolling();
          this.startPublicTrackingPolling();
        };
        this.socket.onOrderStatusUpdate(this.socketListener);

        // Map init after DOM renders
        setTimeout(() => {
          const lat = Number(this.order?.pickup?.lat);
          const lng = Number(this.order?.pickup?.lng);
          if (lat && lng && this.mapContainer) this.initMap(lat, lng);
          if (this.isLiveStatus(this.order.status)) this.viewLiveTracking();
        }, 400);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Unable to fetch order. Please try again.';
      },
    });
  }

  // ─── Provider order helper (create = .order, sync = .orders[0]) ─────────
  private getProviderOrder(): any {
    const raw = this.order?.rawProviderResponse;
    return raw?.order || raw?.orders?.[0] || null;
  }

  private connectRealtime(): void {
    if (this.hasAuthToken() && this.order?.user) {
      this.socket.connect(this.order.user);
      return;
    }

    if (this.order?._id) {
      this.socket.connectToOrder(this.order._id);
    }
  }

  private normalizeCourier(courier: any): any {
    if (!courier) return null;

    const latitude =
      courier.latitude !== undefined && courier.latitude !== null
        ? Number(courier.latitude)
        : courier.location?.lat !== undefined && courier.location?.lat !== null
          ? Number(courier.location.lat)
          : null;
    const longitude =
      courier.longitude !== undefined && courier.longitude !== null
        ? Number(courier.longitude)
        : courier.location?.lng !== undefined && courier.location?.lng !== null
          ? Number(courier.location.lng)
          : null;

    return {
      ...courier,
      photo_url: courier.photo_url || courier.photoUrl || null,
      latitude,
      longitude,
    };
  }

  private isTerminalStatus(status: string): boolean {
    return ['DELIVERED', 'CANCELLED', 'FAILED'].includes(status);
  }

  private isLiveStatus(status: string): boolean {
    return ['PICKED_UP', 'IN_TRANSIT'].includes(status);
  }

  getProviderMatter(): string {
    return (
      this.getProviderOrder()?.matter || this.order?.package?.description || '—'
    );
  }

  getProviderWeight(): number {
    return (
      this.getProviderOrder()?.total_weight_kg ??
      this.order?.package?.weight ??
      0
    );
  }

  // ─── Status helpers ──────────────────────────────────────────────────────
  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status?.replace('_', ' ');
  }

  isStepDone(step: string): boolean {
    return (
      this.order?.statusHistory?.some((s: any) => s.status === step) ?? false
    );
  }

  getStepTimestamp(step: string): string {
    const d = this.timelineMap[step];
    if (!d) return 'Pending';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  buildTimelineMap(): void {
    this.timelineMap = {};
    this.order?.statusHistory?.forEach((e: any) => {
      if (e.status && e.timestamp)
        this.timelineMap[e.status] = new Date(e.timestamp);
    });
  }

  getVehicleLabel(): string {
    const vehicleId = Number(this.order?.vehicleTypeId);

    return this.vehicleMap[vehicleId] || 'Courier Vehicle';
  }

  get hasCourierMarker(): boolean {
    return !!this.courierMarker;
  }

  getEstimatedDistance(order: any): string {
    const raw = order?.rawProviderResponse;
    const pts = raw?.order?.points || raw?.orders?.[0]?.points;
    if (!pts || pts.length < 2) return 'Calculating...';

    const p = pts[0],
      q = pts[1];
    if (!p?.latitude || !q?.latitude) return 'Calculating...';

    const d = this.haversine(
      Number(p.latitude),
      Number(p.longitude),
      Number(q.latitude),
      Number(q.longitude),
    );
    return d.toFixed(1) + ' km';
  }

  getEstimatedDuration(order: any): string {
    const raw = order?.rawProviderResponse;
    const pts = raw?.order?.points || raw?.orders?.[0]?.points;
    if (!pts || pts.length < 2) return 'Calculating...';

    const p = pts[0],
      q = pts[1];
    if (!p?.latitude || !q?.latitude) return 'Calculating...';

    const d = this.haversine(
      Number(p.latitude),
      Number(p.longitude),
      Number(q.latitude),
      Number(q.longitude),
    );
    const mins = Math.round((d / 30) * 60);
    return mins >= 60
      ? `${Math.floor(mins / 60)} hr ${mins % 60} min`
      : `${mins} min`;
  }

  private haversine(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Courier info ────────────────────────────────────────────────────────
  // Borzo courier API returns: { courier_id, name, surname, phone, photo_url, latitude, longitude }
  loadCourierInfo(): void {
    if (!this.order?._id) return;

    this.api.get(`/orders/${this.order._id}/courier`).subscribe({
      next: (res: any) => {
        this.courier = this.normalizeCourier(res?.data);
        //  If Borzo returned live location — update map immediately
        const lat = this.courier?.latitude
          ? Number(this.courier.latitude)
          : null;
        const lng = this.courier?.longitude
          ? Number(this.courier.longitude)
          : null;
        if (lat && lng) this.updateCourierLocation(lat, lng);
      },
      error: () => {
        /* courier not available yet — silent */
      },
    });
  }

  // ─── Live tracking polling ───────────────────────────────────────────────
  // Uses Borzo courier API directly (returns lat/lng for active orders)
  startTrackingPolling(): void {
    if (this.isTerminalStatus(this.order?.status)) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      return;
    }

    if (
      this.order?.status !== 'PICKED_UP' &&
      this.order?.status !== 'IN_TRANSIT'
    )
      return;
    if (this.trackingInterval) return;

    this.trackingInterval = setInterval(() => {
      if (!this.order?._id) return;

      // ✅ Poll Borzo courier API — it returns latitude/longitude directly
      this.api.get(`/orders/${this.order._id}/courier`).subscribe({
        next: (res: any) => {
          const c = res?.data;
          if (!c) return;

          // Update courier card
          if (c.name || c.phone) this.courier = c;

          // Update map location — Borzo returns String coords
          const lat = c.latitude ? Number(c.latitude) : null;
          const lng = c.longitude ? Number(c.longitude) : null;
          if (lat && lng) this.updateCourierLocation(lat, lng);
        },
      });
    }, APP_CONFIG.TRACKING_POLL_INTERVAL);
  }

  startPublicTrackingPolling(): void {
    if (!this.order?._id || this.hasAuthToken()) return;

    if (this.isTerminalStatus(this.order.status)) {
      clearInterval(this.summaryInterval);
      this.summaryInterval = null;
      return;
    }

    if (this.summaryInterval) return;

    this.summaryInterval = setInterval(() => {
      this.api.get(`/orders/track/${this.order._id}`).subscribe({
        next: (res: any) => {
          const latest = res?.data;
          if (!latest) return;

          this.order = {
            ...this.order,
            ...latest,
          };
          this.courier = this.normalizeCourier(latest.courier || this.courier);
          this.buildTimelineMap();

          if (this.isLiveStatus(this.order.status)) {
            this.viewLiveTracking();
          }

          if (this.isTerminalStatus(this.order.status)) {
            clearInterval(this.summaryInterval);
            this.summaryInterval = null;
          }
        },
      });
    }, 15000);
  }

  viewLiveTracking(): void {
    if (!this.order?._id) return;
    this.liveTrackingMessage = 'Refreshing live location...';

    this.api.get(`/orders/${this.order._id}/tracking`).subscribe({
      next: (res: any) => {
        const points = res?.data?.points;
        const courier = this.normalizeCourier(res?.data?.courier);
        if (courier) {
          this.courier = courier;
        }

        if (courier?.latitude && courier?.longitude) {
          this.updateCourierLocation(courier.latitude, courier.longitude);
          this.liveTrackingMessage = 'Courier location is live';
          if (this.hasAuthToken()) {
            this.startTrackingPolling();
          } else {
            this.startPublicTrackingPolling();
          }
          return;
        }

        if (!points?.length) return;

        const lat = Number(this.order.pickup?.lat || points[0]?.latitude);
        const lng = Number(this.order.pickup?.lng || points[0]?.longitude);
        if (lat && lng) this.initMap(lat, lng);
      },
      error: () => {
        this.liveTrackingMessage = 'Unable to refresh live location';
        console.error('Tracking fetch failed');
      },
    });
  }

  initMap(lat: number, lng: number): void {
    if (
      !this.isGoogleMapsReady() ||
      !this.mapContainer?.nativeElement
    ) {
      this.mapsUnavailable = true;
      return;
    }

    this.mapsUnavailable = false;
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 13,
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
        strokeColor: this.themeColor('--mk-primary', '#ff7a00'),
        strokeWeight: 4,
        strokeOpacity: 0.85,
      },
    });
    this.directionsRenderer.setMap(this.map);

    this.liveDirectionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: this.themeColor('--mk-secondary', '#2563eb'),
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    });
    this.liveDirectionsRenderer.setMap(this.map);

    this.addPickupDropMarkers();
  }

  addPickupDropMarkers(): void {
    if (!this.map || !this.isGoogleMapsReady()) return;
    if (!this.order) return;
    const pLat = Number(this.order.pickup?.lat);
    const pLng = Number(this.order.pickup?.lng);
    const dLat = Number(this.order.drop?.lat);
    const dLng = Number(this.order.drop?.lng);
    if (!pLat || !pLng || !dLat || !dLng) return;

    this.pickupMarker = new google.maps.Marker({
      position: { lat: pLat, lng: pLng },
      map: this.map,
      title: 'Pickup location',
      icon: '/assets/icons/pickup-marker.svg',
    });

    this.dropMarker = new google.maps.Marker({
      position: { lat: dLat, lng: dLng },
      map: this.map,
      title: 'Drop location',
      icon: '/assets/icons/drop-marker.svg',
    });

    this.pickupInfoWindow = new google.maps.InfoWindow({
      content: this.markerInfoContent('Pickup', this.order.pickup?.address),
    });
    this.dropInfoWindow = new google.maps.InfoWindow({
      content: this.markerInfoContent('Drop', this.order.drop?.address),
    });

    this.pickupMarker.addListener('click', () => {
      this.pickupInfoWindow.open(this.map, this.pickupMarker);
    });
    this.dropMarker.addListener('click', () => {
      this.dropInfoWindow.open(this.map, this.dropMarker);
    });

    this.drawRoute(pLat, pLng, dLat, dLng);
  }

  drawRoute(pLat: number, pLng: number, dLat: number, dLng: number): void {
    if (!this.directionsService || !this.directionsRenderer || !this.isGoogleMapsReady()) {
      return;
    }

    this.directionsService.route(
      {
        origin: { lat: pLat, lng: pLng },
        destination: { lat: dLat, lng: dLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status !== 'OK') return;
        this.directionsRenderer.setDirections(result);

        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: pLat, lng: pLng });
        bounds.extend({ lat: dLat, lng: dLng });
        this.routeBounds = bounds;
        this.map.fitBounds(bounds);

        const leg = result.routes[0].legs[0];
        this.distanceText = leg.distance.text;
        this.etaText = leg.duration.text;
      },
    );
  }

  updateCourierLocation(lat: number, lng: number): void {
    if (!this.map) this.initMap(lat, lng);
    if (!this.map || !this.isGoogleMapsReady()) return;

    this.trackingLastUpdated = new Date();
    this.liveTrackingMessage = 'Courier location is live';

    if (!this.courierMarker) {
      this.courierMarker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: 'Courier live location',
        icon: {
          url: '/assets/icons/vehicles/bike.svg',
          scaledSize: new google.maps.Size(40, 40),
        },
      });
      this.courierInfoWindow = new google.maps.InfoWindow({
        content: this.markerInfoContent(
          'Courier',
          `${this.courier?.name || 'Delivery partner'} ${this.courier?.phone || ''}`.trim(),
        ),
      });
      this.courierMarker.addListener('click', () => {
        this.courierInfoWindow.open(this.map, this.courierMarker);
      });
      this.previousLat = lat;
      this.previousLng = lng;
      if (this.autoFollowCourier) this.map.panTo({ lat, lng });
      this.drawCourierToDropRoute(lat, lng);
      return;
    }

    if (this.previousLat === lat && this.previousLng === lng) return;

    this.animateMarker(this.previousLat!, this.previousLng!, lat, lng);
    this.calculateETA(lat, lng);
    this.drawCourierToDropRoute(lat, lng);
    this.previousLat = lat;
    this.previousLng = lng;
  }

  animateMarker(sLat: number, sLng: number, eLat: number, eLng: number): void {
    if (!this.courierMarker || !this.map || !this.isGoogleMapsReady()) return;
    if (this.animationInterval) clearInterval(this.animationInterval);
    const steps = 60;
    let step = 0;
    const dLat = (eLat - sLat) / steps;
    const dLng = (eLng - sLng) / steps;

    this.animationInterval = setInterval(() => {
      step++;
      const pos = new google.maps.LatLng(
        sLat + dLat * step,
        sLng + dLng * step,
      );
      this.courierMarker.setPosition(pos);
      if (this.autoFollowCourier) this.map.panTo(pos);
      if (step >= steps) clearInterval(this.animationInterval);
    }, 80);
  }

  calculateETA(cLat: number, cLng: number): void {
    if (!this.directionsService || !this.order?.drop?.lat) return;
    if (!this.isGoogleMapsReady()) return;

    this.directionsService.route(
      {
        origin: { lat: cLat, lng: cLng },
        destination: {
          lat: Number(this.order.drop.lat),
          lng: Number(this.order.drop.lng),
        },
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

  recenterCourier(): void {
    const position = this.courierMarker?.getPosition?.();
    if (!this.map || !position) return;

    this.autoFollowCourier = true;
    this.map.panTo(position);
    this.map.setZoom(Math.max(this.map.getZoom() || 15, 15));
  }

  fitFullRoute(): void {
    if (!this.map) return;

    if (this.routeBounds) {
      this.autoFollowCourier = false;
      this.map.fitBounds(this.routeBounds, 72);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const markers = [this.pickupMarker, this.dropMarker, this.courierMarker];
    let hasMarker = false;

    markers.forEach((marker) => {
      const position = marker?.getPosition?.();
      if (position) {
        bounds.extend(position);
        hasMarker = true;
      }
    });

    if (hasMarker) {
      this.autoFollowCourier = false;
      this.map.fitBounds(bounds, 72);
    }
  }

  private drawCourierToDropRoute(cLat: number, cLng: number): void {
    if (
      !this.liveDirectionsRenderer ||
      !this.directionsService ||
      !this.order?.drop?.lat ||
      !this.isGoogleMapsReady()
    ) {
      return;
    }

    this.directionsService.route(
      {
        origin: { lat: cLat, lng: cLng },
        destination: {
          lat: Number(this.order.drop.lat),
          lng: Number(this.order.drop.lng),
        },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status !== 'OK') return;
        this.liveDirectionsRenderer.setDirections(result);
      },
    );
  }

  private markerInfoContent(title: string, value: string = ''): string {
    const safeTitle = String(title || '').replace(/[<>]/g, '');
    const safeValue = String(value || '').replace(/[<>]/g, '');

    return `
      <div style="font-family: Arial, sans-serif; min-width: 160px;">
        <strong style="display:block;margin-bottom:4px;">${safeTitle}</strong>
        <span style="font-size:12px;line-height:1.35;color:#475569;">${safeValue}</span>
      </div>
    `;
  }

  // ─── Reset ───────────────────────────────────────────────────────────────
  resetTracking(): void {
    this.orderId = '';
    this.order = null;
    this.error = '';
    this.courier = null;
    this.etaText = '';
    this.distanceText = '';
    this.previousLat = null;
    this.previousLng = null;

    clearInterval(this.trackingInterval);
    this.trackingInterval = null;
    clearInterval(this.summaryInterval);
    this.summaryInterval = null;
    clearInterval(this.animationInterval);
    this.animationInterval = null;
    this.socket.disconnect();

    [this.courierMarker, this.pickupMarker, this.dropMarker].forEach((m) => {
      if (m) m.setMap(null);
    });
    this.courierMarker = null;
    this.pickupMarker = null;
    this.dropMarker = null;

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }
    if (this.liveDirectionsRenderer) {
      this.liveDirectionsRenderer.setMap(null);
      this.liveDirectionsRenderer = null;
    }
    this.courierInfoWindow = null;
    this.pickupInfoWindow = null;
    this.dropInfoWindow = null;
    this.map = null;
    this.trackingLastUpdated = null;
    this.liveTrackingMessage = 'Waiting for courier location';
  }
  ngOnDestroy(): void {
    clearInterval(this.trackingInterval);
    clearInterval(this.summaryInterval);
    clearInterval(this.animationInterval);

    this.routeSub?.unsubscribe();

    this.socketListener = null;
    this.socket.disconnect();
  }
}
