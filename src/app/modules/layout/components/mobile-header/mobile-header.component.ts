import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-mobile-header',
  templateUrl: './mobile-header.component.html',
  styleUrls: ['./mobile-header.component.css'],
})
export class MobileHeaderComponent {
  @Output() menuClicked = new EventEmitter<void>();

  openMenu(): void {
    this.menuClicked.emit();
  }
}
