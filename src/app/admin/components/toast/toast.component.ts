import { Component, OnInit } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-admin-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe((t) => {
      this.addToast(t);
    });
  }

  addToast(toast: Toast) {
    this.toasts = [toast, ...this.toasts].slice(0, 3); // max 3

    setTimeout(() => {
      this.removeToast(toast);
    }, 3000);
  }

  removeToast(toast: Toast) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
}
