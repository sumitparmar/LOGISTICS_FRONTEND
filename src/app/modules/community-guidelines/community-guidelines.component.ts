import { Component } from '@angular/core';

@Component({
  selector: 'app-community-guidelines',
  templateUrl: './community-guidelines.component.html',
  styleUrls: ['./community-guidelines.component.css'],
})
export class CommunityGuidelinesComponent {
  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
