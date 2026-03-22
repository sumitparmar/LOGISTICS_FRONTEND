import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AddressService {
  constructor(private http: HttpClient) {}

  getAddresses() {
    return this.http.get<any>('/api/addresses');
  }

  createAddress(data: any) {
    return this.http.post<any>('/api/addresses', data);
  }
}
