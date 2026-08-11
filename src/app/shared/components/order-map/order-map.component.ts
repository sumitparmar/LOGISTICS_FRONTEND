import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-order-map',
  template: `
    <div class="map-fallback" *ngIf="mapsUnavailable">
      Map preview is unavailable. Route details remain available in the order timeline.
    </div>
    <div #mapContainer class="map-container" *ngIf="!mapsUnavailable"></div>
  `,
  styleUrls: ['./order-map.component.scss'],
})
export class OrderMapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() pickup!: { lat: number; lng: number };
  @Input() drop!: { lat: number; lng: number };
  @Output() routeInfo = new EventEmitter<{
    distance: string;
    duration: string;
  }>();

  distance: string = '';
  duration: string = '';
  mapsUnavailable = false;
  private map: any;
  private directionsRenderer: any;

  private themeColor(token: string, fallback: string): string {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
      fallback
    );
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.pickup || !this.drop) return;

    const isReady = await this.waitForGoogleMaps();
    if (!isReady) {
      this.mapsUnavailable = true;
      return;
    }

    this.initMap();
    this.renderRoute();
    this.addMarkers();
  }

  initMap(): void {
    if (!this.isGoogleMapsReady() || !this.mapContainer?.nativeElement) {
      this.mapsUnavailable = true;
      return;
    }

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 12,
      center: this.pickup,

      gestureHandling: 'greedy',
      // Optional UX improvements
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: true,
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: this.themeColor('--mk-primary', '#ff7a00'),
        strokeWeight: 4,
      },
    });

    this.directionsRenderer.setMap(this.map);
  }

  addMarkers(): void {
    if (!this.map || !this.isGoogleMapsReady()) return;

    new google.maps.Marker({
      position: this.pickup,
      map: this.map,
      label: {
        text: 'P',
        color: this.themeColor('--mk-text-inverse', '#ffffff'),
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: this.themeColor('--mk-success', '#16a34a'),
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: this.themeColor('--mk-card-bg', '#ffffff'),
      },
    });

    new google.maps.Marker({
      position: this.drop,
      map: this.map,
      label: {
        text: 'D',
        color: this.themeColor('--mk-text-inverse', '#ffffff'),
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: this.themeColor('--mk-danger', '#dc2626'),
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: this.themeColor('--mk-card-bg', '#ffffff'),
      },
    });
  }

  //   renderRoute(): void {
  //     const directionsService = new google.maps.DirectionsService();

  //     directionsService.route(
  //       {
  //         origin: this.pickup,
  //         destination: this.drop,
  //         travelMode: google.maps.TravelMode.DRIVING,
  //       },
  //       (result: any, status: any) => {
  //         if (status === 'OK') {
  //           this.directionsRenderer.setDirections(result);

  //           const bounds = new google.maps.LatLngBounds();

  //           bounds.extend(this.pickup);
  //           bounds.extend(this.drop);

  //           this.map.fitBounds(bounds);
  //         }
  //       },
  //     );
  //   }

  renderRoute(): void {
    if (!this.map || !this.directionsRenderer || !this.isGoogleMapsReady()) {
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: this.pickup,
        destination: this.drop,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(this.pickup);
          bounds.extend(this.drop);
          this.map.fitBounds(bounds, 80);

          const leg = result.routes[0].legs[0];

          this.distance = leg.distance?.text || '';
          this.duration = leg.duration?.text || '';

          this.routeInfo.emit({
            distance: this.distance,
            duration: this.duration,
          });
        }
      },
    );
  }

  private isGoogleMapsReady(): boolean {
    return !!(window as any).google?.maps;
  }

  waitForGoogleMaps(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isGoogleMapsReady()) {
        resolve(true);
      } else {
        let attempts = 0;
        const check = setInterval(() => {
          attempts += 1;
          if (this.isGoogleMapsReady()) {
            clearInterval(check);
            resolve(true);
            return;
          }

          if (attempts >= 30) {
            clearInterval(check);
            resolve(false);
          }
        }, 100);
      }
    });
  }
}
