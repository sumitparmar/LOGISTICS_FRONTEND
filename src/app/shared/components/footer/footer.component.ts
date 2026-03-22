import { Component } from '@angular/core';
import { FOOTER_DATA } from './footer.config';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent {
  footer = FOOTER_DATA;

  currentYear = new Date().getFullYear();
}
