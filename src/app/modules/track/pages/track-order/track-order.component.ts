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

  private map: any;
  private directionsService: any;
  private directionsRenderer: any;
  private pickupMarker: any;
  private dropMarker: any;
  private courierMarker: any;
  private trackingInterval: any;
  private animationInterval: any;
  private socketListener: any;
  private routeBounds: any;

  private previousLat: number | null = null;
  private previousLng: number | null = null;

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

  ngOnInit(): void {
    this.loadVehicleCatalog();

    this.route.queryParams.subscribe((p) => {
      this.orderId = p['orderId'] || p['id'] || '';
      if (this.orderId) this.trackOrder();
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

    this.api.get(`/orders/${this.orderId}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.order = res?.data;

        if (!this.order) {
          this.error = 'Order not found';
          return;
        }

        this.buildTimelineMap();
        this.loadCourierInfo();
        this.startTrackingPolling();

        // Socket
        if (this.order?.user) this.socket.connect(this.order.user);

        this.socketListener = (data: any) => {
          if (data.orderId !== this.order._id) return;
          this.order.status = data.status;
          if (
            !this.order.statusHistory.find((s: any) => s.status === data.status)
          ) {
            this.order.statusHistory.push({
              status: data.status,
              timestamp: new Date(),
            });
            this.buildTimelineMap();
          }
          this.startTrackingPolling();
        };
        this.socket.onOrderStatusUpdate(this.socketListener);

        // Map init after DOM renders
        setTimeout(() => {
          const lat = Number(this.order?.pickup?.lat);
          const lng = Number(this.order?.pickup?.lng);
          if (lat && lng && this.mapContainer) this.initMap(lat, lng);
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

  // ─── Vehicle label ───────────────────────────────────────────────────────
  getVehicleLabel(): string {
    const t = this.order?.vehicle?.type;
    return t ? this.vehicleMap[t] || 'Courier Vehicle' : 'Courier Vehicle';
  }

  // ─── Estimated distance & duration (fallback haversine) ─────────────────
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
        this.courier = res?.data || null;

        // ✅ If Borzo returned live location — update map immediately
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
    if (this.order?.status === 'DELIVERED') {
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

  viewLiveTracking(): void {
    if (!this.order?._id) return;

    this.api.get(`/orders/${this.order._id}/tracking`).subscribe({
      next: (res: any) => {
        const points = res?.data?.points;
        if (!points?.length) return;

        const courierPoint = points.find((p: any) => p.delivery);

        if (!courierPoint?.latitude) {
          const lat = Number(this.order.pickup?.lat);
          const lng = Number(this.order.pickup?.lng);
          if (lat && lng) this.initMap(lat, lng);
          return;
        }

        this.updateCourierLocation(
          Number(courierPoint.latitude),
          Number(courierPoint.longitude),
        );
        this.startTrackingPolling();
      },
      error: () => console.error('Tracking fetch failed'),
    });
  }

  // ─── Map ─────────────────────────────────────────────────────────────────
  initMap(lat: number, lng: number): void {
    if (!this.mapContainer?.nativeElement) return;

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
        strokeColor: '#ff6b00',
        strokeWeight: 4,
        strokeOpacity: 0.85,
      },
    });
    this.directionsRenderer.setMap(this.map);

    this.addPickupDropMarkers();
  }

  addPickupDropMarkers(): void {
    if (!this.order) return;
    const pLat = Number(this.order.pickup?.lat);
    const pLng = Number(this.order.pickup?.lng);
    const dLat = Number(this.order.drop?.lat);
    const dLng = Number(this.order.drop?.lng);
    if (!pLat || !pLng || !dLat || !dLng) return;

    this.pickupMarker = new google.maps.Marker({
      position: { lat: pLat, lng: pLng },
      map: this.map,
      icon: '/assets/icons/pickup-marker.svg',
    });

    this.dropMarker = new google.maps.Marker({
      position: { lat: dLat, lng: dLng },
      map: this.map,
      icon: '/assets/icons/drop-marker.svg',
    });

    this.drawRoute(pLat, pLng, dLat, dLng);
  }

  drawRoute(pLat: number, pLng: number, dLat: number, dLng: number): void {
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
      if (this.autoFollowCourier) this.map.panTo({ lat, lng });
      return;
    }

    if (this.previousLat === lat && this.previousLng === lng) return;

    this.animateMarker(this.previousLat!, this.previousLng!, lat, lng);
    this.calculateETA(lat, lng);
    this.previousLat = lat;
    this.previousLng = lng;
  }

  animateMarker(sLat: number, sLng: number, eLat: number, eLng: number): void {
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
    clearInterval(this.animationInterval);
    this.animationInterval = null;

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
    this.map = null;
  }

  ngOnDestroy(): void {
    clearInterval(this.trackingInterval);
    clearInterval(this.animationInterval);
    this.socketListener = null;
    this.socket.disconnect();
  }
}
