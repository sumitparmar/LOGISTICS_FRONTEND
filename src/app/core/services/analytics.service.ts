import { Injectable } from '@angular/core';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private pushToDataLayer(eventName: string, params: any = {}) {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...params,
      });
    }
  }

  trackEvent(eventName: string, params: any = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        event_category: 'engagement',
        event_label: eventName,
      });
    }
  }

  trackPageView(url: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: document.title,
      });
    } else {
      this.pushToDataLayer('page_view', {
        page_path: url,
      });
    }
  }
}
