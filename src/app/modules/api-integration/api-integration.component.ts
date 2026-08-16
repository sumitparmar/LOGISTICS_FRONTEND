import { Component } from '@angular/core';

interface IntegrationStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-api-integration',
  templateUrl: './api-integration.component.html',
  styleUrls: ['./api-integration.component.scss'],
})
export class ApiIntegrationComponent {
  steps: IntegrationStep[] = [
    { number: '01', title: 'Create your business workflow', description: 'Collect pickup, drop, package, contact, and delivery timing details in your own checkout or operations system.' },
    { number: '02', title: 'Request a delivery estimate', description: 'Send the route and service details to your MoveKart backend integration and show the returned estimate before confirmation.' },
    { number: '03', title: 'Place and track the order', description: 'Create the delivery after customer confirmation, store the order reference, and subscribe to status updates for your operations team.' },
  ];

  capabilities = [
    'Route-based price calculation',
    'Delivery order creation and editing',
    'Order cancellation and status tracking',
    'Courier and delivery updates through callbacks',
    'COD and payment state visibility',
  ];
}
