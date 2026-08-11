import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface CityPage {
  slug: string;
  name: string;
  region: string;
  localities: string[];
  faqs: { q: string; a: string }[];
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
          q: 'How fast can I get a mini truck in Mumbai?',
          a: 'Most MoveKart partners arrive at your pickup location in Mumbai within 15-20 minutes, subject to availability and traffic.',
        },
        {
          q: "Does MoveKart operate during Mumbai's non-entry truck hours?",
          a: '2-wheelers and 3-wheelers operate round the clock. Larger truck movement follows Mumbai Traffic Police timing restrictions.',
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

  vehicles = [
    { type: '3-Wheeler', capacity: '500 kg', idealFor: 'Small boxes, local deliveries', price: 'Rs. 160' },
    { type: 'Tata Ace (Chota Hathi)', capacity: '750 kg', idealFor: 'Commercial goods, appliances', price: 'Rs. 210' },
    { type: 'Pickup / 8ft', capacity: '1200 kg', idealFor: 'Furniture, bulk goods', price: 'Rs. 300' },
  ];

  city!: CityPage;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
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
                a: 'Motorbikes, 3-wheelers, tempo trucks and Tata Ace vehicles are supported based on cargo size, weight and operational availability.',
              },
            ],
      };
    });
  }
}
