import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private directionsService: any;

  constructor() {
    this.directionsService = new google.maps.DirectionsService();
  }

  /**
   * Simple route (used by Pricing page)
   */
  calculateRoute(origin: string, destination: string): Promise<any> {
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
    const request = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    return this.runRoute(request);
  }

  /**
   * Core route executor
   */
  private runRoute(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
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
