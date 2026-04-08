import { Component } from '@angular/core';

@Component({
  selector: 'app-courier',
  templateUrl: './courier.component.html',
  styleUrls: ['./courier.component.scss'],
})
export class CourierComponent {
  hours: number = 6;
  days: number = 15;

  private readonly BASE_RATE = 70;

  cities: string[] = [
    'Delhi/NCR',
    'Mumbai',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Bengaluru',
    'Jaipur',
  ];

  faqs = [
    {
      q: 'How is Borzo different from other courier services?',
      a: 'Borzo offers flexible delivery jobs with instant payouts, simple app usage, and no fixed schedule.',
      open: false,
    },
    {
      q: 'What are the requirements for a Borzo courier job?',
      a: 'You need a smartphone, valid ID, and a vehicle (bike/scooter) to start delivering.',
      open: false,
    },
    {
      q: 'How quickly can I get paid for my deliveries?',
      a: 'Payments are processed quickly after order completion depending on your payout method.',
      open: false,
    },
    {
      q: 'How can I find out how much money I will receive for an order?',
      a: 'The app shows estimated earnings before you accept any order.',
      open: false,
    },
    {
      q: 'Can I combine Borzo with other work or studies?',
      a: 'Yes, Borzo is fully flexible and allows you to work anytime.',
      open: false,
    },
    {
      q: 'How often do I need to work as a courier?',
      a: 'There is no minimum requirement. Work as much or as little as you want.',
      open: false,
    },
    {
      q: 'Are there currently any courier vacancies?',
      a: 'Yes, Borzo regularly accepts new couriers across multiple cities.',
      open: false,
    },
    {
      q: 'What do recipients expect from couriers?',
      a: 'Timely delivery, proper handling, and communication if needed.',
      open: false,
    },
    {
      q: 'What do I need to deliver orders?',
      a: 'A vehicle, smartphone, and basic documentation are required.',
      open: false,
    },
    {
      q: 'Which cities offer the opportunity to get delivery jobs?',
      a: 'Borzo operates in major cities like Delhi, Mumbai, Bengaluru, and more.',
      open: false,
    },
  ];

  calculateIncome(): number {
    return this.hours * this.days * this.BASE_RATE;
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
