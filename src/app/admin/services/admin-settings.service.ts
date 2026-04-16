import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class AdminSettingsService {
  constructor(private api: ApiService) {}

  getSettings() {
    return this.api.get('/admin/settings');
  }

  updateSettings(payload: any) {
    return this.api.put('/admin/settings', payload);
  }
}
