import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-order-map',
  template: `<div #mapContainer class="map-container"></div>`,
  styleUrls: ['./order-map.component.scss'],
})
export class OrderMapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() pickup!: { lat: number; lng: number };
  @Input() drop!: { lat: number; lng: number };

  private map: any;
  private directionsRenderer: any;

  async ngAfterViewInit(): Promise<void> {
    if (!this.pickup || !this.drop) return;

    await this.loadGoogleMaps();

    this.initMap();
    this.renderRoute();
    this.addMarkers();
  }

  //   initMap(): void {
  //     this.map = new google.maps.Map(this.mapContainer.nativeElement, {
  //       zoom: 12,
  //       center: this.pickup,
  //     });

  //     this.directionsRenderer = new google.maps.DirectionsRenderer({
  //       suppressMarkers: true,
  //       polylineOptions: {
  //         strokeColor: '#4f46e5',
  //         strokeWeight: 4,
  //       },
  //     });

  //     this.directionsRenderer.setMap(this.map);
  //   }

  initMap(): void {
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 12,
      center: this.pickup,

      // ✅ FIX HERE
      gestureHandling: 'greedy', // 🔥 removes ctrl+scroll message

      // Optional UX improvements
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: true,
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4f46e5',
        strokeWeight: 4,
      },
    });

    this.directionsRenderer.setMap(this.map);
  }

  addMarkers(): void {
    new google.maps.Marker({
      position: this.pickup,
      map: this.map,
      label: {
        text: 'P',
        color: '#fff',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#16a34a', // green
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#fff',
      },
    });

    new google.maps.Marker({
      position: this.drop,
      map: this.map,
      label: {
        text: 'D',
        color: '#fff',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#dc2626', // red
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#fff',
      },
    });
  }

  renderRoute(): void {
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

          this.map.fitBounds(bounds);
        }
      },
    );
  }

  loadGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
      } else {
        const check = setInterval(() => {
          if ((window as any).google && (window as any).google.maps) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      }
    });
  }
}
