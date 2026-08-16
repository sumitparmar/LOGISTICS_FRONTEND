import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PricingService } from '../../core/services/pricing.service';

interface CityPage {
  slug: string;
  name: string;
  region: string;
  localities: string[];
  faqs: { q: string; a: string }[];
}

interface CityVehicle {
  type: string;
  capacity: string;
  idealFor: string;
  price: string;
}

@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.scss'],
})
export class CityComponent implements OnInit {
  cities: CityPage[] = [
    {
      slug: 'mumbai',
      name: 'Mumbai',
      region: 'Mumbai and Navi Mumbai',
      localities: [
        'Andheri',
        'Borivali',
        'Bandra',
        'Goregaon',
        'Malad',
        'Dadar',
        'Kurla',
        'Thane',
        'Powai',
        'Colaba',
        'Lower Parel',
        'Vashi',
        'Belapur',
        'Panvel',
        'Bhiwandi',
      ],
      faqs: [
        {
          q: 'How fast can I book a delivery in Mumbai?',
          a: 'MoveKart confirms the available delivery option and estimated timing after you enter the route. Actual arrival depends on location, traffic and live partner availability.',
        },
        {
          q: 'Is delivery available throughout Mumbai?',
          a: 'Coverage is checked from the live service catalog and route quote. If a route cannot be served, MoveKart will show that before the order is created.',
        },
      ],
    },
    {
      slug: 'delhi-ncr',
      name: 'Delhi/NCR',
      region: 'Delhi, Noida, Gurugram, Faridabad and Ghaziabad',
      localities: ['Connaught Place', 'Karol Bagh', 'Dwarka', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad', 'Okhla'],
      faqs: [],
    },
    {
      slug: 'bengaluru',
      name: 'Bengaluru',
      region: 'Bengaluru urban logistics zones',
      localities: ['Whitefield', 'Indiranagar', 'Koramangala', 'Electronic City', 'Hebbal', 'Marathahalli', 'Yeshwanthpur'],
      faqs: [],
    },
    {
      slug: 'pune',
      name: 'Pune',
      region: 'Pune and Pimpri-Chinchwad',
      localities: ['Hinjewadi', 'Wakad', 'Kothrud', 'Viman Nagar', 'Hadapsar', 'Baner', 'Pimpri-Chinchwad'],
      faqs: [],
    },
    {
      slug: 'chennai',
      name: 'Chennai',
      region: 'Chennai city and nearby industrial corridors',
      localities: ['T Nagar', 'Guindy', 'Velachery', 'Anna Nagar', 'Tambaram', 'Porur', 'Ambattur'],
      faqs: [],
    },
    {
      slug: 'hyderabad',
      name: 'Hyderabad',
      region: 'Hyderabad and Secunderabad',
      localities: ['HITEC City', 'Madhapur', 'Gachibowli', 'Kukatpally', 'Banjara Hills', 'Secunderabad'],
      faqs: [],
    },
    {
      slug: 'ahmedabad',
      name: 'Ahmedabad',
      region: 'Ahmedabad commercial and residential zones',
      localities: ['Navrangpura', 'Satellite', 'Bopal', 'Maninagar', 'Naroda', 'Vatva', 'SG Highway'],
      faqs: [],
    },
    {
      slug: 'kolkata',
      name: 'Kolkata',
      region: 'Kolkata and nearby business hubs',
      localities: ['Salt Lake', 'Park Street', 'Howrah', 'Dum Dum', 'New Town', 'Ballygunge', 'Behala'],
      faqs: [],
    },
  ];

  vehicles: CityVehicle[] = [];

  city!: CityPage;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pricingService: PricingService,
  ) {}

  ngOnInit(): void {
    this.pricingService.getVehicles().subscribe({
      next: (response: any) => {
        const catalog = Array.isArray(response?.data) ? response.data : [];
        this.vehicles = catalog.map((vehicle: any) => ({
          type: vehicle.name,
          capacity: vehicle.maxWeightKg ? `Up to ${vehicle.maxWeightKg} kg` : 'Shown at booking',
          idealFor: vehicle.description || 'Cargo that fits the displayed weight limit',
          price: 'Quote after route selection',
        }));
      },
      error: () => {
        this.vehicles = [];
      },
    });

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || 'mumbai';
      const city = this.cities.find((item) => item.slug === slug);
      if (!city) {
        this.router.navigate(['/city/mumbai']);
        return;
      }
      this.city = {
        ...city,
        faqs: city.faqs.length
          ? city.faqs
          : [
              {
                q: `How fast can I book goods transport in ${city.name}?`,
                a: `MoveKart supports on-demand local goods transport in ${city.name}, with arrival time based on nearby vehicle availability and local traffic.`,
              },
              {
                q: `Which vehicles are available in ${city.name}?`,
                a: 'MoveKart shows the vehicles currently available for the selected service area. Capacity and pricing are confirmed from the live booking quote before you place an order.',
              },
            ],
      };
    });
  }
}
