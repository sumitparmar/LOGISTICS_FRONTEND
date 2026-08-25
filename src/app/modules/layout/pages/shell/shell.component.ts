import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { SocketService } from 'src/app/core/services/socket.service';
import { CustomerNotificationService } from 'src/app/modules/notifications/services/customer-notification.service';
@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
})
export class ShellComponent implements OnInit {
  showOnboarding = false;

  isMobileMenuOpen = false;
  feedbackPrompt: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService,
    private notificationService: CustomerNotificationService,
  ) {}

  ngOnInit(): void {
    const shouldShow = sessionStorage.getItem('show_onboarding');

    if (shouldShow === 'true') {
      this.showOnboarding = true;
    }

    sessionStorage.removeItem('show_onboarding');

    const user = this.authService.getUser();
    const userId = user?._id || user?.id;
    if (userId) {
      this.socketService.connect(userId);
      this.socketService.onCustomerNotification((notification: any) => {
        this.handleFeedbackNotification(notification);
      });
      this.loadPendingFeedbackPrompt();
    }
  }

  private loadPendingFeedbackPrompt(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response: any) => {
        const notification = (response?.data || []).find((item: any) =>
          item.type === 'ORDER_DELIVERED' &&
          item.isRead === false &&
          item.actionUrl?.includes('feedback=1') &&
          !this.isFeedbackDismissed(item.order?._id),
        );
        if (notification) this.feedbackPrompt = notification;
      },
      error: () => {},
    });
  }

  private handleFeedbackNotification(notification: any): void {
    if (
      notification?.type === 'ORDER_DELIVERED' &&
      notification?.actionUrl?.includes('feedback=1') &&
      !this.isFeedbackDismissed(notification.order?._id)
    ) {
      this.feedbackPrompt = notification;
    }
  }

  private isFeedbackDismissed(orderId?: string): boolean {
    return !!orderId && localStorage.getItem(`feedback_prompt_dismissed:${orderId}`) === 'true';
  }

  openFeedbackPrompt(): void {
    const prompt = this.feedbackPrompt;
    if (!prompt) return;
    this.feedbackPrompt = null;
    if (prompt._id) this.notificationService.markAsRead(prompt._id).subscribe({ error: () => {} });
    this.router.navigateByUrl(prompt.actionUrl || `/app/orders/${prompt.order?._id}?feedback=1`);
  }

  dismissFeedbackPrompt(): void {
    const prompt = this.feedbackPrompt;
    if (!prompt) return;
    const orderId = prompt.order?._id;
    if (orderId) {
      localStorage.setItem(`feedback_prompt_dismissed:${orderId}`, 'true');
      this.notificationService.dismissFeedbackPrompt(orderId).subscribe({ error: () => {} });
    }
    if (prompt._id) this.notificationService.markAsRead(prompt._id).subscribe({ error: () => {} });
    this.feedbackPrompt = null;
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

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;

    document.body.style.overflow = '';
  }
}
