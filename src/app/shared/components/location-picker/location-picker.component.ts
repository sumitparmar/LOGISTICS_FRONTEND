import {
  Component,
  EventEmitter,
  Input,
  Output,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.css'],
})
export class LocationPickerComponent implements AfterViewInit {
  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  @Input() latitude!: number;
  @Input() longitude!: number;

  @Output() locationSelected = new EventEmitter<{
    lat: number;
    lng: number;
    address: string;
  }>();

  selectedAddress = '';

  selectedLocation = {
    lat: 0,
    lng: 0,
  };

  isLoadingLocation = false;

  map: any;
  marker: any;
  geocoder: any;

  ngAfterViewInit(): void {
    if (typeof google === 'undefined') {
      return;
    }

    this.geocoder = new google.maps.Geocoder();

    const center = {
      lat: this.latitude || 28.6139,
      lng: this.longitude || 77.209,
    };

    const autocomplete = new google.maps.places.Autocomplete(
      this.searchInput.nativeElement,
      {
        fields: ['formatted_address', 'geometry'],
      },
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry?.location) {
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      const address =
        place.formatted_address || this.searchInput.nativeElement.value;

      const location = { lat, lng };

      this.map.setCenter(location);
      this.marker.setPosition(location);

      this.updateSelectedLocation(lat, lng, address);
    });

    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center,
      zoom: 16,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    });

    this.marker = new google.maps.Marker({
      position: center,
      map: this.map,
      draggable: true,
    });

    this.marker.addListener('dragend', () => {
      const position = this.marker.getPosition();

      if (!position) return;

      this.reverseGeocode(position.lat(), position.lng());
    });
  }

  reverseGeocode(lat: number, lng: number): void {
    this.geocoder.geocode(
      {
        location: { lat, lng },
      },
      (results: any, status: any) => {
        if (status !== 'OK') return;

        if (!results.length) return;
        this.updateSelectedLocation(lat, lng, results[0].formatted_address);
      },
    );
  }

  private updateSelectedLocation(
    lat: number,
    lng: number,
    address: string,
  ): void {
    this.selectedAddress = address;

    this.selectedLocation = {
      lat,
      lng,
    };

    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = address;
    }

    this.locationSelected.emit({
      lat,
      lng,
      address,
    });
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const location = { lat, lng };

        this.map.setCenter(location);
        this.marker.setPosition(location);

        this.reverseGeocode(lat, lng);
      },
      (error) => {
        console.error('Unable to fetch current location', error);

        alert(
          'Unable to access your current location. Please allow location permission.',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }
}
