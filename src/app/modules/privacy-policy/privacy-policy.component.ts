import { Component, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
})
export class PrivacyPolicyComponent implements AfterViewInit {
  activeSection: string = 'intro';

  navItems = [
    { id: 'intro', label: 'Introduction' },
    { id: 'definitions', label: 'Definitions' },
    { id: 'services', label: 'Services' },
    { id: 'collection', label: 'Information Collection' },
    { id: 'usage', label: 'Use of Information' },
    { id: 'sharing', label: 'Sharing' },
    { id: 'thirdparty', label: 'Third Party Policies' },
    { id: 'security', label: 'Security' },
    { id: 'updates', label: 'Updates' },
    { id: 'contact', label: 'Contact' },
  ];

  ngAfterViewInit(): void {
    this.observeSections();
  }

  observeSections(): void {
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
          }
        });
      },
      { threshold: 0.5 },
    );

    sections.forEach((section) => observer.observe(section));
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
