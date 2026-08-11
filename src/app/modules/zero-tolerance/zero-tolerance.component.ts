import { Component } from '@angular/core';

@Component({
  selector: 'app-zero-tolerance',
  templateUrl: './zero-tolerance.component.html',
  styleUrls: ['./zero-tolerance.component.scss'],
})
export class ZeroToleranceComponent {
  navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'goods', label: 'Prohibited Goods' },
    { id: 'driver-safety', label: 'Driver Safety' },
    { id: 'fraud', label: 'Fraud & Integrity' },
    { id: 'conduct', label: 'Conduct' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'consequences', label: 'Consequences' },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
