import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private api: ApiService) {}

  getProfile() {
    return this.api.get('/auth/me');
  }

  updateProfile(payload: any) {
    return this.api.put('/auth/profile', payload);
  }

  updateProfilePhoto(profilePhoto: string) {
    return this.api.put('/auth/profile-photo', { profilePhoto });
  }

  changePassword(payload: any) {
    return this.api.post('/auth/change-password', payload);
  }
}
