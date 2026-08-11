import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private directionsService: any;

  constructor() {
    if (this.isReady()) {
      this.directionsService = new google.maps.DirectionsService();
    }
  }

  isReady(): boolean {
    return typeof google !== 'undefined' && !!google.maps;
  }

  hasPlaces(): boolean {
    return this.isReady() && !!google.maps.places?.Autocomplete;
  }

  /**
   * Simple route (used by Pricing page)
   */

  calculateRoute(origin: string, destination: string): Promise<any> {
    if (!this.isReady()) {
      return Promise.reject(new Error('Google Maps not loaded'));
    }

    const request = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    return this.runRoute(request);
  }

  /**
   * Advanced route (Create Delivery page with waypoints)
   */

  calculateRouteWithWaypoints(
    origin: any,
    destination: any,
    waypoints: any[] = [],
  ): Promise<any> {
    if (!this.isReady()) {
      return Promise.reject(new Error('Google Maps not loaded'));
    }

    const request = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    return this.runRoute(request);
  }

  private runRoute(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.directionsService) {
        if (this.isReady()) {
          this.directionsService = new google.maps.DirectionsService();
        } else {
          reject(new Error('Google Maps not loaded'));
          return;
        }
      }
      this.directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          resolve(result);
        } else {
          reject(status);
        }
      });
    });
  }
}
