import {
  Component,
  EventEmitter,
  Output,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-location-picker-modal',
  templateUrl: './location-picker-modal.component.html',
  styleUrls: ['./location-picker-modal.component.scss'],
})
export class LocationPickerModalComponent implements AfterViewInit {
  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  @Output() confirmLocation = new EventEmitter<{
    lat: number;
    lng: number;
    address: string;
  }>();

  @Output() closed = new EventEmitter<void>();
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;

  @Input() title = 'Choose Pickup Location';

  @Input() subtitle = 'Drag the map until the pin is over your exact location';

  @Input() placeholder = 'Search location';
  @Input() addressLabel = 'Selected Pickup Address';
  map: any;
  marker: any;
  geocoder: any;
  private reverseGeocodeTimer: any;
  selectedAddress = '';
  isResolvingAddress = false;
  selectedLocation = {
    lat: 28.6139,
    lng: 77.209,
  };

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Existing coordinates available
      if (this.lat != null && this.lng != null) {
        this.selectedLocation = {
          lat: this.lat,
          lng: this.lng,
        };

        this.initializeMap();
        return;
      }

      // No coordinates yet → use current GPS
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.selectedLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          this.initializeMap();
        },

        () => {
          // Permission denied or GPS unavailable
          this.initializeMap();
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    }, 100);
  }
  private initializeMap(): void {
    if (typeof google === 'undefined') {
      return;
    }

    this.geocoder = new google.maps.Geocoder();

    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: this.selectedLocation,
      zoom: 16,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      gestureHandling: 'greedy',
    });

    this.marker = null;

    setTimeout(() => {
      google.maps.event.trigger(this.map, 'resize');
      this.map.setCenter(this.selectedLocation);
    }, 100);

    this.initializeAutocomplete();

    this.map.addListener('idle', () => {
      const center = this.map.getCenter();

      if (!center) {
        return;
      }

      this.updateLocation(center.lat(), center.lng());
    });

    // this.marker.addListener('dragend', () => {
    //   const pos = this.marker.getPosition();

    //   if (!pos) {
    //     return;
    //   }

    //   this.updateLocation(pos.lat(), pos.lng());
    // });

    this.reverseGeocode(this.selectedLocation.lat, this.selectedLocation.lng);
  }

  // private initializeAutocomplete(): void {
  //   const autocomplete = new google.maps.places.Autocomplete(
  //     this.searchInput.nativeElement,
  //     {
  //       fields: ['formatted_address', 'geometry'],
  //     },
  //   );

  //   autocomplete.addListener('place_changed', () => {
  //     const place = autocomplete.getPlace();

  //     if (!place.geometry?.location) {
  //       return;
  //     }

  //     const lat = place.geometry.location.lat();
  //     const lng = place.geometry.location.lng();

  //     this.selectedAddress =
  //       place.formatted_address || this.searchInput.nativeElement.value;
  //     this.selectedLocation = { lat, lng };

  //     this.map.panTo(this.selectedLocation);
  //     this.map.setZoom(17);

  //     this.updateLocation(lat, lng);
  //   });
  // }

  private initializeAutocomplete(): void {
    console.log('initializeAutocomplete called');
    console.log('Search Input:', this.searchInput.nativeElement);
    console.log('Google Places:', google.maps.places);

    setTimeout(() => {
      const autocomplete = new google.maps.places.Autocomplete(
        this.searchInput.nativeElement,
        {
          fields: ['formatted_address', 'geometry'],
        },
      );

      console.log('Autocomplete instance created:', autocomplete);

      autocomplete.addListener('place_changed', () => {
        console.log('place_changed fired');

        const place = autocomplete.getPlace();
        console.log('geometry', place.geometry);
        console.log('location', place.geometry?.location);
        console.log('formatted_address', place.formatted_address);
        console.log('place_id', place.place_id);
        console.log('FULL PLACE OBJECT', place);
        console.log('Selected Place:', place);

        if (!place.geometry || !place.geometry.location) {
          console.warn('No geometry returned');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        this.selectedLocation = {
          lat,
          lng,
        };

        this.selectedAddress =
          place.formatted_address || this.searchInput.nativeElement.value;

        this.searchInput.nativeElement.value = this.selectedAddress;

        this.map.panTo(this.selectedLocation);
        this.map.setZoom(17);

        this.updateLocation(lat, lng);
      });
    }, 300);
  }

  private updateLocation(lat: number, lng: number): void {
    this.selectedLocation = {
      lat,
      lng,
    };
    clearTimeout(this.reverseGeocodeTimer);

    this.isResolvingAddress = true;

    this.reverseGeocodeTimer = setTimeout(() => {
      this.reverseGeocode(lat, lng);
    }, 300);
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.geocoder.geocode(
      {
        location: {
          lat,
          lng,
        },
      },
      (results: any, status: any) => {
        if (status !== 'OK') {
          this.isResolvingAddress = false;
          return;
        }
        if (!results.length) {
          this.isResolvingAddress = false;
          return;
        }

        this.selectedAddress = results[0].formatted_address;

        this.searchInput.nativeElement.value = this.selectedAddress;
        this.isResolvingAddress = false;
      },
    );
  }

  useCurrentLocation(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.selectedLocation = {
          lat,
          lng,
        };

        this.map.panTo(this.selectedLocation);
        this.map.setZoom(17);

        this.updateLocation(lat, lng);
      },
      () => {
        alert('Unable to access current location.');
      },
      {
        enableHighAccuracy: true,
      },
    );
  }

  confirm(): void {
    this.confirmLocation.emit({
      lat: this.selectedLocation.lat,
      lng: this.selectedLocation.lng,
      address: this.selectedAddress,
    });
  }

  close(): void {
    this.closed.emit();
  }
}
