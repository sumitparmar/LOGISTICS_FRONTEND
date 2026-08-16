import { Component } from '@angular/core';

interface BlogPost {
  category: string;
  title: string;
  summary: string;
  body: string[];
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
})
export class BlogComponent {
  activePost: BlogPost | null = null;

  posts: BlogPost[] = [
    {
      category: 'Delivery Planning',
      title: 'How to plan a reliable same-day delivery',
      summary: 'A practical checklist for preparing addresses, packages, timing, and recipient details before booking.',
      body: [
        'A successful delivery starts with complete pickup and drop information. Add building details, a reachable contact number, and any access instructions before confirming the order.',
        'Choose the vehicle based on the package size and weight, then review the live estimate before booking. Clear instructions help the delivery partner complete the route without avoidable delays.',
      ],
    },
    {
      category: 'Business Logistics',
      title: 'Making daily store deliveries easier to manage',
      summary: 'Ways retailers and growing businesses can bring delivery booking, tracking, and support into one workflow.',
      body: [
        'Centralising delivery requests gives teams one place to review active jobs, delivery status, customer contacts, and pricing details.',
        'Start with repeatable pickup instructions and a consistent order reference. This makes support conversations faster and gives your operations team a dependable audit trail.',
      ],
    },
    {
      category: 'Operations',
      title: 'Understanding delivery pricing before you book',
      summary: 'What can affect an estimate, including route distance, vehicle selection, package details, urgency, and optional services.',
      body: [
        'Delivery pricing is calculated from the route and the selected service details. Estimates can change when the address, vehicle, package weight, or delivery timing changes.',
        'MoveKart shows the calculated amount before order confirmation so customers can review the charge before they place the delivery request.',
      ],
    },
  ];

  openPost(post: BlogPost): void {
    this.activePost = this.activePost === post ? null : post;
  }
}
