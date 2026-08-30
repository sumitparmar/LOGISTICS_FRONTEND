import { Component } from '@angular/core';

interface AboutStat {
  value: string;
  label: string;
}

interface AboutCard {
  icon?: string;
  title: string;
  description: string;
}

interface AboutImage {
  src: string;
  alt: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  readonly heroImage: AboutImage = {
    src: '/assets/images/movekart-about-hero.png',
    alt: 'Courier partner confirming a delivery beside a loaded van',
  };

  readonly networkImage: AboutImage = {
    src: '/assets/images/movekart-operations.png',
    alt: 'Logistics operations desk showing route planning and parcels',
  };

  readonly partnerImage: AboutImage = {
    src: '/assets/images/movekart-contact-support.png',
    alt: 'Support specialist coordinating delivery assistance',
  };

  readonly heroStats: AboutStat[] = [
    { value: 'Live', label: 'Order support' },
    { value: 'Real-time', label: 'Tracking visibility' },
    { value: 'Instant', label: 'Price estimates' },
  ];

  readonly metrics: AboutStat[] = [
    { value: '50K+', label: 'Deliveries completed' },
    { value: '1000+', label: 'Courier partners' },
    { value: '10+', label: 'Cities covered' },
    { value: '500+', label: 'Business clients' },
  ];

  readonly steps: AboutCard[] = [
    {
      title: 'Book a Pickup',
      description:
        'Add pickup and drop locations, choose a vehicle, and see pricing before placing the delivery.',
    },
    {
      title: 'Get Matched Fast',
      description:
        'MoveKart routes the order to the right courier partner based on availability and delivery type.',
    },
    {
      title: 'Track Every Move',
      description:
        'Follow order progress with live status updates, route context, and clear delivery milestones.',
    },
  ];

  readonly capabilities: AboutCard[] = [
    {
      icon: 'route',
      title: 'Route Intelligence',
      description:
        'Distance-aware pricing and route planning help customers book with confidence.',
    },
    {
      icon: 'shield',
      title: 'Secure Handling',
      description:
        'Operational workflows are designed around dependable pickups, safer handling, and clear updates.',
    },
    {
      icon: 'activity',
      title: 'Real-time Visibility',
      description:
        'Customers and teams can monitor delivery status from booking to completion.',
    },
    {
      icon: 'plug',
      title: 'Business APIs',
      description:
        'Businesses can connect delivery creation, tracking, and fulfillment into their own systems.',
    },
  ];

  readonly businessSolutions: AboutCard[] = [
    {
      title: 'E-commerce Fulfillment',
      description:
        'Create deliveries from customer orders and keep buyers informed after checkout.',
    },
    {
      title: 'Retail Movement',
      description:
        'Move inventory between stores, warehouses, and customers with predictable coordination.',
    },
    {
      title: 'On-demand Courier',
      description:
        'Support urgent document, package, and local delivery needs from one simple platform.',
    },
  ];

  readonly technology: AboutCard[] = [
    {
      title: 'Live Operations Layer',
      description:
        'Status events, support workflows, and order data stay connected across the platform.',
    },
    {
      title: 'Provider Network',
      description:
        'MoveKart can work with logistics partners through a unified provider layer.',
    },
    {
      title: 'Customer Dashboard',
      description:
        'Customers manage deliveries, tracking, invoices, notifications, and wallet activity in one place.',
    },
  ];

  readonly networkPoints = [
    'Real-time courier tracking',
    'Smart route and price calculation',
    'Delivery partner marketplace',
    'Business-ready delivery APIs',
  ];
}
