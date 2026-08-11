import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class DriverOnboardingService {
  constructor(private api: ApiService) {}

  getMine(): Observable<any> {
    return this.api.get('/driver-onboarding/me');
  }

  saveMine(payload: any): Observable<any> {
    return this.api.post('/driver-onboarding/me', payload);
  }

  submitMine(payload: any): Observable<any> {
    return this.api.post('/driver-onboarding/me/submit', payload);
  }
}
