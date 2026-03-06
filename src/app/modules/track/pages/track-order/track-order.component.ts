import { Component } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { OnInit } from '@angular/core';
import { SocketService } from '../../../../core/services/socket.service';
import { AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { APP_CONFIG } from 'src/environments/app.config';
import { getCurrencySymbol } from '../../../../core/utils/currency.util';
declare const google: any;
@Component({
  selector: 'app-track-order',
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css'],
})
export class TrackOrderComponent implements OnInit, AfterViewInit {
  orderId = '';
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  currencySymbol = getCurrencySymbol();
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
    'CANCELLED',
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
        this.startTrackingPolling();
        this.loadCourierInfo();

        // if (this.order?.user) {
        //   this.socketService.connect(this.order.user);
        // }

        // this.socketService.onOrderStatusUpdate((data: any) => {
        //   if (data.orderId === this.order._id) {
        //     this.order.status = data.status;

        //     this.order.statusHistory.push({
        //       status: data.status,
        //     });
        //   }
        // });

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

  initMap(lat: number, lng: number) {
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 12,
      center: { lat, lng },
    });

    this.directionsService = new google.maps.DirectionsService();

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
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

    if (!pickupLat || !dropLat) return;

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
      return;
    }

    if (this.previousLat === null || this.previousLng === null) {
      this.previousLat = lat;
      this.previousLng = lng;
    }

    this.animateMarker(this.previousLat, this.previousLng, lat, lng);
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
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    const steps = 30;
    let step = 0;

    const deltaLat = (endLat - startLat) / steps;
    const deltaLng = (endLng - startLng) / steps;

    this.animationInterval = setInterval(() => {
      step++;

      const lat = startLat + deltaLat * step;
      const lng = startLng + deltaLng * step;

      const position = new google.maps.LatLng(lat, lng);

      this.courierMarker.setPosition(position);
      this.map.panTo(position);

      if (step >= steps) {
        clearInterval(this.animationInterval);
      }
    }, 300);
  }

  getVehicleLabel(): string {
    const vehicleType = this.order?.vehicle?.type;

    if (!vehicleType) return 'Courier Vehicle';

    return this.vehicleMap[vehicleType] || 'Courier Vehicle';
  }
  viewLiveTracking() {
    if (!this.order?._id) return;

    this.api.get(`/orders/${this.order._id}/tracking`).subscribe({
      next: (res: any) => {
        const points = res?.data?.points;

        if (!points?.length) {
          this.error = 'Courier location not available yet';
          return;
        }

        const courierPoint = points.find((p: any) => p.delivery);

        if (!courierPoint?.latitude) {
          console.log('Courier location not started yet');
          return;
        }

        const lat = Number(courierPoint.latitude);
        const lng = Number(courierPoint.longitude);

        this.updateCourierLocation(lat, lng);

        // start live updates
        this.startTrackingPolling();
      },

      error: () => {
        this.error = 'Unable to fetch courier location';
      },
    });
  }
  startTrackingPolling() {
    if (
      this.order?.status !== 'PICKED_UP' &&
      this.order?.status !== 'IN_TRANSIT'
    ) {
      return;
    }

    if (this.trackingInterval) {
      return;
    }

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
  cancel() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }
}
