import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders.service';
declare const google: any;
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SocketService } from '../../../../core/services/socket.service';
import { ToastService } from '../../../../admin/services/toast.service';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnInit, AfterViewInit {
  private socketBound = false;
  isEditMode: boolean = false;
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChild('dropInput') dropInput!: ElementRef;
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  courierInfo: any = null;
  providerHistory: any = null;
  documents: any = null;
  podData: any = null;
  courierPosition: any = null;
  // pricingBreakdown: any = null;
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
  editableOrder: any = {};

  get providerOrder(): any {
    const raw = this.order?.rawProviderResponse;
    return raw?.order || raw?.orders?.[0] || null;
  }

  private viewInitialized = false;
  private orderLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private socketService: SocketService,
    private toastService: ToastService,
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

  onEditOrder(): void {
    if (!this.order) return;

    if (!this.isEditMode) {
      this.isEditMode = true;

      setTimeout(() => {
        this.initAutocomplete();
      }, 200);

      return;
    }

    // STRICT VALIDATION (FINAL FIX)
    const pickupLat = this.editableOrder.pickupLat ?? this.order.pickup?.lat;
    const pickupLng = this.editableOrder.pickupLng ?? this.order.pickup?.lng;

    const dropLat = this.editableOrder.dropLat ?? this.order.drop?.lat;
    const dropLng = this.editableOrder.dropLng ?? this.order.drop?.lng;

    if (!pickupLat || !pickupLng) {
      this.toastService.error(
        'Please select valid pickup address from suggestions',
      );
      return;
    }

    if (!dropLat || !dropLng) {
      this.toastService.error(
        'Please select valid drop address from suggestions',
      );
      return;
    }

    const payload = this.buildEditPayload();

    if (!payload) {
      this.toastService.error('Unable to update order payload');
      return;
    }

    this.loading = true;

    this.ordersService.editOrder(this.order._id, payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.order = res?.data;
        this.editableOrder = {
          matter:
            this.providerOrder?.matter ||
            this.order?.package?.description ||
            '',
          weight: this.order?.package?.weight || 0,
          category: this.order?.package?.category || '',
          description: this.order?.package?.description || '',

          pickupAddress: this.order?.pickup?.address || '',
          pickupLat: this.order?.pickup?.lat,
          pickupLng: this.order?.pickup?.lng,

          dropAddress: this.order?.drop?.address || '',
          dropLat: this.order?.drop?.lat,
          dropLng: this.order?.drop?.lng,
        };

        setTimeout(() => {
          this.refreshMap();
        }, 100);

        this.isEditMode = false;
        this.editableOrder.pickupAddressManuallyChanged = false;
        this.editableOrder.dropAddressManuallyChanged = false;
        this.toastService.success('Order updated successfully');
      },

      error: (err) => {
        this.loading = false;

        console.error('Edit failed', err);

        this.toastService.error(
          err?.error?.message || 'Edit failed. Try a different valid location.',
        );
      },
    });
  }

  refreshMap() {
    if (!this.order?.pickup || !this.order?.drop) return;

    const pickupLat = this.order.pickup.lat;
    const pickupLng = this.order.pickup.lng;
    const dropLat = this.order.drop.lat;
    const dropLng = this.order.drop.lng;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) return;

    this.initializeMap();
  }

  initAutocomplete() {
    if (!this.isEditMode) return;

    // PICKUP
    const pickupAutocomplete = new google.maps.places.Autocomplete(
      this.pickupInput.nativeElement,
      {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry'],
      },
    );

    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();

      if (!place || !place.geometry) {
        this.toastService.error('Select pickup from suggestions only');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      if (!lat || !lng) {
        this.toastService.error('Invalid pickup location');
        return;
      }

      this.editableOrder.pickupAddress = place.formatted_address;
      this.editableOrder.pickupLat = lat;
      this.editableOrder.pickupLng = lng;

      this.order.pickup.lat = lat;
      this.order.pickup.lng = lng;

      this.refreshMap();
    });

    // DROP
    const dropAutocomplete = new google.maps.places.Autocomplete(
      this.dropInput.nativeElement,
      {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry'],
      },
    );

    dropAutocomplete.addListener('place_changed', () => {
      const place = dropAutocomplete.getPlace();

      if (!place || !place.geometry) {
        this.toastService.error('Select drop from suggestions only');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      if (!lat || !lng) {
        this.toastService.error('Invalid drop location');
        return;
      }

      this.editableOrder.dropAddress = place.formatted_address;
      this.editableOrder.dropLat = lat;
      this.editableOrder.dropLng = lng;

      this.order.drop.lat = lat;
      this.order.drop.lng = lng;

      this.refreshMap();
    });
  }

  onManualAddressChange(type: 'pickup' | 'drop') {
    if (type === 'pickup') {
      this.editableOrder.pickupLat = null;
      this.editableOrder.pickupLng = null;
    }

    if (type === 'drop') {
      this.editableOrder.dropLat = null;
      this.editableOrder.dropLng = null;
    }
  }

  buildEditPayload(): any {
    const providerOrder = this.providerOrder;
    if (!providerOrder) {
      console.error('No provider order found');
      return null;
    }

    const providerPoints = providerOrder.points || [];

    const pickupPoint = providerPoints[0];
    const dropPoint = providerPoints[1];

    if (!pickupPoint || !dropPoint) {
      console.error('Points missing in provider order');
      return null;
    }

    const points = [
      {
        point_id: pickupPoint.point_id,
        address: this.editableOrder.pickupAddress || pickupPoint.address,
        latitude: String(
          this.editableOrder.pickupLat ??
            this.order.pickup?.lat ??
            pickupPoint.latitude,
        ),
        longitude: String(
          this.editableOrder.pickupLng ??
            this.order.pickup?.lng ??
            pickupPoint.longitude,
        ),
        contact_person: {
          phone: pickupPoint.contact_person?.phone,
          name: pickupPoint.contact_person?.name,
        },
        taking_amount: pickupPoint.taking_amount || '0.00',
        buyout_amount: pickupPoint.buyout_amount || '0.00',
        note: pickupPoint.note || null,
        packages: (pickupPoint.packages || []).map((pkg: any) => ({
          order_package_id: pkg.order_package_id,
          items_count: pkg.items_count,
        })),
      },
      {
        point_id: dropPoint.point_id,
        address: this.editableOrder.dropAddress || dropPoint.address,
        latitude: String(
          this.editableOrder.dropLat ??
            this.order.drop?.lat ??
            dropPoint.latitude,
        ),
        longitude: String(
          this.editableOrder.dropLng ??
            this.order.drop?.lng ??
            dropPoint.longitude,
        ),
        contact_person: {
          phone: dropPoint.contact_person?.phone,
          name: dropPoint.contact_person?.name,
        },
        taking_amount: dropPoint.taking_amount || '0.00',
        buyout_amount: dropPoint.buyout_amount || '0.00',
        note: dropPoint.note || null,
        packages: (dropPoint.packages || []).map((pkg: any) => ({
          order_package_id: pkg.order_package_id,
          items_count: pkg.items_count,
        })),
      },
    ];

    return {
      order_id: providerOrder.order_id,
      matter: this.editableOrder.matter,
      vehicle_type_id: Number(this.order.vehicleTypeId) || 8,
      total_weight_kg: Number(this.editableOrder.weight || 0),
      points,
    };
  }

  loadOrder(): void {
    this.loading = true;

    this.ordersService.getOrderById(this.orderId).subscribe({
      next: (res: any) => {
        this.order = res?.data || res;

        this.editableOrder = {
          matter:
            this.providerOrder?.matter ||
            this.order?.package?.description ||
            '',

          weight: this.order?.package?.weight || 0,
          category: this.order?.package?.category || '',
          description: this.order?.package?.description || '',

          pickupAddress: this.order?.pickup?.address || '',
          pickupLat: this.order?.pickup?.lat,
          pickupLng: this.order?.pickup?.lng,

          dropAddress: this.order?.drop?.address || '',
          dropLat: this.order?.drop?.lat,
          dropLng: this.order?.drop?.lng,
        };

        this.loading = false;
        // this.loadPricingBreakdown();
        this.loadCourier();
        this.loadDocuments();
        this.loadProviderHistory();
        const userId = this.order?.user?._id ?? this.order?.user;

        if (userId) {
          this.socketService.connect(userId);
        }

        if (!this.socketBound) {
          this.socketBound = true;

          this.socketService.onOrderStatusUpdate((data: any) => {
            if (data.orderId === this.order._id) {
              this.order.status = data.status;
              this.loadOrderSilently();

              if (data.status === 'DELIVERED') {
                if (this.trackingInterval) {
                  clearInterval(this.trackingInterval);
                }

                this.loadPOD();
              }
            }
          });
        }

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

  loadOrderSilently(): void {
    this.ordersService.getOrderById(this.orderId).subscribe({
      next: (res: any) => {
        this.order = res?.data || res;
      },
      error: () => {},
    });
  }

  getBorzoEta(): string {
    const eta =
      this.order?.rawProviderResponse?.order?.points?.[1]
        ?.estimated_arrival_datetime;

    if (!eta) return '';

    return new Date(eta).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  initializeMap() {
    if (!this.mapContainer?.nativeElement) return;

    const points = this.order?.rawProviderResponse?.order?.points;

    let pickupLat: number | undefined;
    let pickupLng: number | undefined;
    let dropLat: number | undefined;
    let dropLng: number | undefined;

    // PRIMARY SOURCE — DB se (always fresh)
    if (this.order?.pickup?.lat && this.order?.drop?.lat) {
      pickupLat = this.order.pickup.lat;
      pickupLng = this.order.pickup.lng;
      dropLat = this.order.drop.lat;
      dropLng = this.order.drop.lng;
    }
    // FALLBACK — rawProviderResponse
    else if (points && points.length >= 2) {
      const pickupPoint = points.find((p: any) => !p.delivery);
      const dropPoint = points.find((p: any) => p.delivery);

      if (pickupPoint && dropPoint) {
        pickupLat = Number(pickupPoint.latitude);
        pickupLng = Number(pickupPoint.longitude);
        dropLat = Number(dropPoint.latitude);
        dropLng = Number(dropPoint.longitude);
      }
    }

    // If still missing → stop
    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      console.error('❌ No valid coordinates for map');
      return;
    }

    // Initialize map
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

    // Markers + route
    this.addMarkers(pickupLat, pickupLng, dropLat, dropLng);

    // Courier marker (if exists)
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

    // Start tracking
    this.startCourierTracking();
  }

  isStepActive(step: string): boolean {
    if (!this.order?.status) return false;

    const flow = [
      'CREATED',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
    ];

    const currentIndex = flow.indexOf(this.order.status);
    const stepIndex = flow.indexOf(step);

    if (currentIndex === -1 || stepIndex === -1) {
      return false;
    }

    return stepIndex <= currentIndex;
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

  getVehicleLabel(id: number): string {
    const map: Record<number, string> = {
      1: 'Mini 3-Wheeler',
      2: 'Tata Ace 8ft',
      3: 'Tata Ace 7ft',
      5: 'Tempo Truck',
      8: 'Motorbike',
    };

    return map[id] || 'Assigned Vehicle';
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
    }, 10000);
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

        if (this.order?.drop?.lat && this.order?.drop?.lng) {
          this.drawCourierToDropRoute();
        }
      }
    };

    animate();
  }

  drawCourierToDropRoute() {
    if (!this.courierPosition || !this.order?.drop) return;

    this.directionsService.route(
      {
        origin: this.courierPosition,
        destination: {
          lat: this.order.drop.lat,
          lng: this.order.drop.lng,
        },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          const leg = result.routes[0].legs[0];
          this.distanceText = leg.distance.text;
          this.etaText = leg.duration.text;
        }
      },
    );
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

        this.toastService.success('Order cancelled successfully');
        this.loadOrder();
      },

      error: (err) => {
        console.error('Cancel failed', err);

        this.showCancelModal = false;
      },
    });
  }

  // loadPricingBreakdown(): void {
  //   if (!this.order?._id) return;

  //   this.ordersService.getPricingBreakdown(this.order._id).subscribe({
  //     next: (res: any) => {
  //       this.pricingBreakdown = res.data;
  //     },

  //     error: (err) => {
  //       console.error('Pricing breakdown failed', err);
  //     },
  //   });
  // }
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
