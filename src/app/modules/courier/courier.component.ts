import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-courier',
  templateUrl: './courier.component.html',
  styleUrls: ['./courier.component.scss'],
})
export class CourierComponent {
  hours: number = 6;
  days: number = 15;

  private readonly BASE_RATE = 70;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

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
      q: 'How is MoveKart different from other courier services?',
      a: 'MoveKart offers flexible delivery jobs with simple app usage, transparent earnings, and no fixed schedule.',
      open: false,
    },
    {
      q: 'What are the requirements for a MoveKart courier job?',
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
      q: 'Can I combine MoveKart with other work or studies?',
      a: 'Yes, MoveKart is flexible and allows you to choose when you work.',
      open: false,
    },
    {
      q: 'How often do I need to work as a courier?',
      a: 'There is no minimum requirement. Work as much or as little as you want.',
      open: false,
    },
    {
      q: 'Are there currently any courier vacancies?',
      a: 'MoveKart regularly accepts new courier partners across multiple cities.',
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
      a: 'MoveKart operates in major cities like Delhi, Mumbai, Bengaluru, and more.',
      open: false,
    },
  ];

  calculateIncome(): number {
    return this.hours * this.days * this.BASE_RATE;
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  startOnboarding(): void {
    if (this.authService.hasToken()) {
      this.router.navigateByUrl('/app/driver-onboarding');
      return;
    }

    this.router.navigateByUrl('/become-courier/apply');
  }

  downloadGuide(): void {
    const guide = [
      'MoveKart Courier Partner Guide',
      '',
      '1. Create your onboarding profile.',
      '2. Submit your identity, license, vehicle, and payout documents.',
      '3. Wait for operations review and approval.',
      '4. Keep your phone available for delivery updates.',
      '',
      'Support: partners@movekart.in',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([guide], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'movekart-courier-partner-guide.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
