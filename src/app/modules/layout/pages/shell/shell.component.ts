import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
})
export class ShellComponent implements OnInit {
  showOnboarding = false;
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const shouldShow = sessionStorage.getItem('show_onboarding');

    if (shouldShow === 'true') {
      this.showOnboarding = true;
    }

    sessionStorage.removeItem('show_onboarding');
  }

  onModeSelected(mode: string): void {
    this.authService.updateProfile({ deliveryMode: mode }).subscribe({
      next: (res: any) => {
        localStorage.setItem('LOGISTICS_USER', JSON.stringify(res.data));
        this.authService.setDeliveryMode(res.data.deliveryMode);
        this.showOnboarding = false;
      },
      error: () => {
        console.error('Failed to save delivery mode');
      },
    });
  }

  closeOnboarding(): void {
    this.showOnboarding = false;
  }
}
