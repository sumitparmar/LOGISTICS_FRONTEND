import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    __MOVEKART_CONFIG__?: {
      googleMapsApiKey?: string;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class RuntimeConfigService {
  private mapsLoader?: Promise<void>;

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    await this.loadRuntimeConfig();
    try {
      await this.loadGoogleMaps();
    } catch {
      // Maps-dependent screens keep a manual fallback, so config failure must not block app boot.
    }
  }

  private async loadRuntimeConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<{ googleMapsApiKey?: string }>(
          '/assets/runtime-config.json',
        ),
      );
      window.__MOVEKART_CONFIG__ = config || {};
    } catch {
      window.__MOVEKART_CONFIG__ = window.__MOVEKART_CONFIG__ || {};
    }
  }

  private loadGoogleMaps(): Promise<void> {
    const key =
      window.__MOVEKART_CONFIG__?.googleMapsApiKey ||
      environment.googleMapsApiKey;

    if ((window as any).google?.maps || !key) {
      return Promise.resolve();
    }

    if (this.mapsLoader) {
      return this.mapsLoader;
    }

    this.mapsLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        key,
      )}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(script);
    });

    return this.mapsLoader;
  }
}
