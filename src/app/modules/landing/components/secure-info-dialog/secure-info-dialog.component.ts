import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { PricingService } from '../../../../core/services/pricing.service';

interface Feature {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
}

interface TabContent {
  heading: string;
  subheading: string;
  features: Feature[];
}

@Component({
  selector: 'app-secure-info-dialog',
  templateUrl: './secure-info-dialog.component.html',
  styleUrls: ['./secure-info-dialog.component.scss'],
})
export class SecureInfoDialogComponent {
  isVisible = true;
  isClosing = false;
  activeTab = 0;
  availableVehicleText = 'Loading live vehicle availability...';

  tabs = ['Overview', 'Coverage', 'FAQ'];

  content: TabContent[] = [
    {
      heading: 'Protection for Valuable Deliveries',
      subheading:
        'Safe, tracked, and insured transport solutions tailored for your peace of mind.',
      features: [
        {
          icon: 'ID',
          iconBg: 'var(--mk-primary-soft)',
          title: 'Verified Delivery Partners',
          description:
            'Shipments are handled by verified delivery partners following safety and delivery measures.',
        },
        {
          icon: 'GPS',
          iconBg: 'var(--mk-info-soft)',
          title: 'Real-Time GPS Tracking',
          description:
            'Live track your parcel journey from pickup to final drop-off with pinpoint precision.',
        },
        {
          icon: 'INS',
          iconBg: 'var(--mk-success-soft)',
          title: 'MoveKart Parcel Protection',
          description:
            'Eligible high-value shipments can be protected against loss or physical damage during transit, subject to applicable protection terms.',
        },
        {
          icon: 'INR',
          iconBg: 'var(--mk-warning-soft)',
          title: 'Upfront Transparent Pricing',
          description:
            'Get instant pricing with zero hidden charges before booking your vehicle.',
        },
      ],
    },
    {
      heading: 'Multi-City Goods Delivery Network',
      subheading:
        'Reliable intra-city and inter-city courier and goods delivery services across major Indian cities.',
      features: [
        {
          icon: 'LIVE',
          iconBg: 'var(--mk-primary-soft)',
          title: 'Active Cities',
          description:
            'Service availability is checked for the selected route before a booking is confirmed.',
        },
        {
          icon: 'MAP',
          iconBg: 'var(--mk-info-soft)',
          title: 'Delivery Radius',
          description:
            'Hyperlocal same-day city delivery as well as regional goods transport.',
        },
        {
          icon: 'VAN',
          iconBg: 'var(--mk-success-soft)',
          title: 'Fleet Types',
          description:
            this.availableVehicleText,
        },
        {
          icon: 'LAW',
          iconBg: 'var(--mk-danger-soft)',
          title: 'Goods Security Rules',
          description:
            'Damage and loss protection applies when the security fee is paid. Illegal, unsafe, or restricted items are strictly prohibited.',
        },
      ],
    },
    {
      heading: 'Frequently Asked Questions',
      subheading:
        'Quick answers about protection, tracking, cancellation, prohibited items and refunds.',
      features: [
        {
          icon: 'Q1',
          iconBg: 'var(--mk-primary-soft)',
          title: 'How do I protect high-value goods?',
          description:
            'Declare the accurate shipment value during booking and review the protection fee returned in the live fare quote.',
        },
        {
          icon: 'Q2',
          iconBg: 'var(--mk-info-soft)',
          title: 'How do I track my delivery?',
          description:
            'After assignment, use Track Order on your dashboard to see live GPS movement from pickup to destination.',
        },
        {
          icon: 'Q3',
          iconBg: 'var(--mk-warning-soft)',
          title: 'What happens if I cancel?',
          description:
            'Cancellation and any applicable travel or waiting charges are governed by the live order state and the applicable MoveKart policy.',
        },
        {
          icon: 'Q4',
          iconBg: 'var(--mk-danger-soft)',
          title: 'What items are prohibited?',
          description:
            'Hazardous materials, illegal substances, contraband, explosive materials and firearms are strictly prohibited.',
        },
        {
          icon: 'Q5',
          iconBg: 'var(--mk-success-soft)',
          title: 'How fast are refunds processed?',
          description:
            'Approved refunds are initiated through the recorded payment method and may take additional time for bank or payment-network processing.',
        },
      ],
    },
  ];

  get activeContent(): TabContent {
    return this.content[this.activeTab] || this.content[0];
  }

  get features(): Feature[] {
    return this.activeContent.features;
  }

  constructor(
    private dialogRef: MatDialogRef<SecureInfoDialogComponent>,
    private pricingService: PricingService,
  ) {
    this.pricingService.getVehicles().subscribe({
      next: (response: any) => {
        const vehicles = Array.isArray(response?.data) ? response.data : [];
        this.availableVehicleText = vehicles.length
          ? vehicles
              .map((vehicle: any) =>
                vehicle.maxWeightKg
                  ? `${vehicle.name} up to ${vehicle.maxWeightKg} kg`
                  : vehicle.name,
              )
              .join(', ')
          : 'No vehicle options are currently available for this service area.';
        this.content[1].features[2].description = this.availableVehicleText;
      },
      error: () => {
        this.availableVehicleText = 'Vehicle availability is confirmed during booking.';
        this.content[1].features[2].description = this.availableVehicleText;
      },
    });
  }

  setTab(index: number): void {
    this.activeTab = index;
  }

  close(): void {
    if (this.isClosing) return;

    this.isClosing = true;

    setTimeout(() => {
      this.dialogRef.close();
    }, 220);
  }

  learnMore(): void {
    this.setTab(2);
  }
}
