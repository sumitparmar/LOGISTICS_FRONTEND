import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders.service';
declare const google: any;
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SocketService } from '../../../../core/services/socket.service';
@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  courierInfo: any = null;
  providerHistory: any = null;
  documents: any = null;
  podData: any = null;
  courierPosition: any = null;
  pricingBreakdown: any = null;
  showCancelModal = false;
  animationFrame: any = null;
  courierMarker: any = null;
  trackingInterval: any = null;
  map: any;
  directionsService: any;
  directionsRenderer: any;
  pickupMarker: any;
  dropMarker: any;
  etaText: string = '';
  distanceText: string = '';
  orderId!: string;
  order: any = null;
  loading = false;
  mapReady = false;
  pickupCoords: any;
  dropCoords: any;
  private viewInitialized = false;
  private orderLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private socketService: SocketService,
  ) {}

  ngAfterViewInit(): void {
    if (this.order) {
      this.initializeMap();
    }
  }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;

    this.ordersService.getOrderById(this.orderId).subscribe({
      next: (res: any) => {
        this.order = res?.data || res;
        this.loading = false;
        this.loadPricingBreakdown();
        this.loadCourier();
        this.loadDocuments();
        this.loadProviderHistory();
        const userId = this.order.user;

        this.socketService.connect(userId);

        this.socketService.onOrderStatusUpdate((data: any) => {
          if (data.orderId === this.order._id) {
            this.order.status = data.status;
          }
        });
        if (this.order.status === 'DELIVERED') {
          this.loadPOD();
        }

        setTimeout(() => {
          if (this.mapContainer) {
            this.initializeMap();
          }
        }, 200);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  initializeMap() {
    if (!this.mapContainer?.nativeElement) return;
    const points = this.order?.rawProviderResponse?.order?.points;

    if (!points || points.length === 0) return;

    const pickupPoint = points.find((p: any) => !p.delivery);
    const dropPoint = points.find((p: any) => p.delivery);

    if (!pickupPoint || !dropPoint) return;

    const pickupLat = Number(pickupPoint.latitude);
    const pickupLng = Number(pickupPoint.longitude);

    const dropLat = Number(dropPoint.latitude);
    const dropLng = Number(dropPoint.longitude);

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 12,
      center: { lat: pickupLat, lng: pickupLng },
    });

    this.directionsService = new google.maps.DirectionsService();

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#ff7a00',
        strokeWeight: 4,
      },
    });

    this.directionsRenderer.setMap(this.map);

    this.addMarkers(pickupLat, pickupLng, dropLat, dropLng);

    if (
      this.order?.courier?.location?.lat &&
      this.order?.courier?.location?.lng
    ) {
      const lat = this.order.courier.location.lat;
      const lng = this.order.courier.location.lng;

      this.courierMarker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        icon: {
          url: '/assets/icons/bike.png',
          scaledSize: new google.maps.Size(36, 36),
        },
      });
    }
    this.startCourierTracking();
  }
  isStepActive(step: string): boolean {
    if (!this.order?.statusHistory) return false;

    return this.order.statusHistory.some((s: any) => s.status === step);
  }
  getStatusTimestamp(status: string): string | null {
    if (!this.order?.statusHistory) return null;

    const record = this.order.statusHistory.find(
      (s: any) => s.status === status,
    );

    if (!record) return null;

    const date = new Date(record.timestamp);

    return record.timestamp;
  }

  statusLabel(status: string): string {
    const map: any = {
      CREATED: 'Order Created',
      ASSIGNED: 'Courier Assigned',
      PICKED_UP: 'Package Picked Up',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
    };

    return map[status] || status;
  }

  addMarkers(
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
  ) {
    new google.maps.Marker({
      position: { lat: pickupLat, lng: pickupLng },
      map: this.map,
      icon: '/assets/icons/pickup-marker.svg',
    });

    new google.maps.Marker({
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

          const bounds = result.routes[0].bounds;
          this.map.fitBounds(bounds);

          const leg = result.routes[0].legs[0];

          this.distanceText = leg.distance.text;
          this.etaText = leg.duration.text;
        }
      },
    );
  }

  startCourierTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    this.trackingInterval = setInterval(() => {
      this.ordersService.getOrderById(this.orderId).subscribe({
        next: (res: any) => {
          const order = res?.data || res;

          const lat = order?.courier?.location?.lat;
          const lng = order?.courier?.location?.lng;

          if (!lat || !lng) return;

          if (!this.courierMarker) {
            this.courierPosition = { lat, lng };

            this.courierMarker = new google.maps.Marker({
              position: this.courierPosition,
              map: this.map,
              icon: {
                url: '/assets/icons/vehicles/bike.svg',
                scaledSize: new google.maps.Size(36, 36),
              },
            });
          } else {
            const newPosition = { lat, lng };

            this.animateCourierMove(newPosition);
          }
        },
      });
    }, 5000); // update every 5 seconds
  }

  cancelOrder() {
    this.ordersService.cancelOrder(this.order._id).subscribe(() => {
      this.loadOrder();
    });
  }

  ngOnDestroy(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.socketService.disconnect();
  }

  animateCourierMove(target: any) {
    if (!this.courierMarker || !this.courierPosition) return;

    const start = this.courierPosition;
    const end = target;

    const frames = 60;
    let frame = 0;

    const deltaLat = (end.lat - start.lat) / frames;
    const deltaLng = (end.lng - start.lng) / frames;

    const animate = () => {
      frame++;

      const lat = start.lat + deltaLat * frame;
      const lng = start.lng + deltaLng * frame;

      const position = new google.maps.LatLng(lat, lng);

      this.courierMarker.setPosition(position);

      if (frame < frames) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.courierPosition = target;
      }
    };

    animate();
  }

  openCancelModal(): void {
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  confirmCancelOrder(): void {
    if (!this.order?._id) return;

    this.ordersService.cancelOrder(this.order._id).subscribe({
      next: () => {
        this.showCancelModal = false;

        alert('Order cancelled successfully');

        this.loadOrder();
      },

      error: (err) => {
        console.error('Cancel failed', err);

        this.showCancelModal = false;
      },
    });
  }

  loadPricingBreakdown(): void {
    if (!this.order?._id) return;

    this.ordersService.getPricingBreakdown(this.order._id).subscribe({
      next: (res: any) => {
        this.pricingBreakdown = res.data;
      },

      error: (err) => {
        console.error('Pricing breakdown failed', err);
      },
    });
  }
  loadCourier(): void {
    if (!this.order?._id) return;

    this.ordersService.getCourier(this.order._id).subscribe({
      next: (res: any) => {
        this.courierInfo = res.data;
      },

      error: (err) => {
        console.error('Courier fetch failed', err);
      },
    });
  }
  loadPOD(): void {
    if (!this.order?._id) return;

    this.ordersService.getPOD(this.order._id).subscribe({
      next: (res: any) => {
        this.podData = res.data;
      },

      error: (err) => {
        console.error('POD fetch failed', err);
      },
    });
  }
  loadDocuments(): void {
    if (!this.order?._id) return;

    this.ordersService.getDocuments(this.order._id).subscribe({
      next: (res: any) => {
        this.documents = res.data;
      },

      error: (err) => {
        console.error('Documents fetch failed', err);
      },
    });
  }

  loadProviderHistory(): void {
    if (!this.order?._id) return;

    this.ordersService.getProviderHistory(this.order._id).subscribe({
      next: (res: any) => {
        this.providerHistory = res.data;
      },

      error: (err) => {
        console.error('History fetch failed', err);
      },
    });
  }
}
