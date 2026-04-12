import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private baseUrl = `${environment.apiBaseUrl}/addresses`;

  constructor(private http: HttpClient) {}

  getAddresses() {
    return this.http.get<any>(this.baseUrl);
  }

  createAddress(data: any) {
    return this.http.post<any>(this.baseUrl, data);
  }
}
