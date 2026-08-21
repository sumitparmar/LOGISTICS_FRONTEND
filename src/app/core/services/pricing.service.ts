import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SUPPORTED_CUSTOMER_VEHICLE_IDS = new Set([8]);

function filterCustomerVehicles(response: any): any {
  const vehicles = Array.isArray(response?.data) ? response.data : [];
  const supportedVehicles = vehicles.filter((vehicle: any) =>
    SUPPORTED_CUSTOMER_VEHICLE_IDS.has(Number(vehicle.id)),
  );

  return {
    ...response,
    data: supportedVehicles.length
      ? supportedVehicles
      : [
          {
            id: 8,
            code: 'BIKE',
            name: 'Motorbike',
            maxWeightKg: 20,
          },
        ],
  };
}

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  constructor(private api: ApiService) {}

  getVehicles(): Observable<any> {
    return this.api.get('/providers/vehicles').pipe(map(filterCustomerVehicles));
  }

  calculatePrice(payload: any): Observable<any> {
    return this.api.post('/orders/calculate', payload);
  }
}
