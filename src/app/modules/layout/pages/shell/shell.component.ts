import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
})
export class ShellComponent implements OnInit {
  showOnboarding = false;

  ngOnInit(): void {
    const mode = localStorage.getItem('deliveryMode');

    if (!mode) {
      setTimeout(() => {
        this.showOnboarding = true;
      }, 400);
    }
  }

  onModeSelected(mode: string): void {
    localStorage.setItem('deliveryMode', mode);

    this.showOnboarding = false;
  }

  closeOnboarding(): void {
    this.showOnboarding = false;
  }
}
