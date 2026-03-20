import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  constructor(private api: ApiService) {}

  getVehicles(): Observable<any> {
    return this.api.get('/vehicles');
  }

  calculatePrice(payload: any): Observable<any> {
    return this.api.post('/orders/calculate', payload);
  }
}
