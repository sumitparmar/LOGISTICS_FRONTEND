import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent {
  groups: FaqGroup[] = [
    {
      title: 'Booking & Services',
      items: [
        {
          question: 'How do I book a vehicle on MoveKart?',
          answer:
            'Open the MoveKart app or web portal, enter pickup and drop-off addresses, choose the vehicle type that suits your cargo, view the instant fare estimate, and click Book Now. A nearby verified driver partner will be assigned automatically.',
        },
        {
          question: 'Can I schedule a booking in advance?',
          answer:
            'MoveKart is primarily on-demand, but you can schedule bookings up to 24 hours in advance for planned moves, office shifting, or recurring business deliveries.',
        },
        {
          question: 'What vehicle options are available on MoveKart?',
          answer:
            'The booking screen shows the vehicle options currently available for your MoveKart service area. Capacity limits are displayed beside each live option and are validated again before the order is sent.',
        },
        {
          question: 'What items are prohibited from transport?',
          answer:
            'Illegal drugs, narcotics, unauthorized pharmaceuticals, weapons, explosives, fireworks, flammable liquids, dangerous chemicals, toxic waste, stolen goods, contraband, biological samples and live animals are prohibited.',
        },
      ],
    },
    {
      title: 'Pricing, Wallet & Payments',
      items: [
        {
          question: 'How is the delivery fare calculated?',
          answer:
            'Fares are shown transparently before booking using provider base price, admin pricing rules, applicable fees, protection charges, GST and any applicable operational charges.',
        },
        {
          question: 'What payment methods are accepted?',
          answer:
            'MoveKart is being prepared for UPI, cards, net banking and wallet-style checkout. Cash-on-delivery availability depends on enabled payment configuration and operational policy.',
        },
        {
          question: 'How do I top up my MoveKart Wallet?',
          answer:
            'Wallet functionality is currently paused in the user panel and will be restored when it is ready for production use.',
        },
      ],
    },
    {
      title: 'Tracking, Safety & Protection',
      items: [
        {
          question: 'How can I track my shipment in real time?',
          answer:
            'After a delivery partner accepts your booking, a live GPS tracking link appears on your dashboard. You can share tracking with the recipient when available.',
        },
        {
          question: 'Is my shipment protected against damage or loss?',
          answer:
            'MoveKart Parcel Protection is available during checkout when enabled for the route. Declare an accurate shipment value and review the protection fee and eligibility returned in the live quote.',
        },
        {
          question: 'What should I do if my parcel arrives damaged or is lost?',
          answer:
            'Report the issue within 24 hours of order completion via Help & Support or email support@movekart.in with order ID and photos. The safety team will review the claim.',
        },
      ],
    },
    {
      title: 'Cancellations & Refunds',
      items: [
        {
          question: 'Can I cancel after a driver is assigned?',
          answer:
            'Cancellation is governed by the live order state and the applicable MoveKart policy. Any cancellation or waiting charge is shown or communicated before it is applied.',
        },
        {
          question: 'How long does it take to receive a refund?',
          answer:
            'Approved refunds are recorded against the payment used for the order. Wallet credits are reflected in the ledger; bank or payment-network timing depends on the configured gateway.',
        },
      ],
    },
    {
      title: 'Business & Enterprise Accounts',
      items: [
        {
          question: 'Does MoveKart offer enterprise or bulk shipping?',
          answer:
            'Yes. MoveKart Business can support corporate accounts with centralized dashboards, bulk invoicing, priority allocation and API integration workflows.',
        },
        {
          question: 'How do I register for MoveKart Business?',
          answer:
            'Visit movekart.in/business with GSTIN and company details, or contact business@movekart.in. Accounts are reviewed and activated by the operations team.',
        },
      ],
    },
  ];
}
