import { Component, OnInit } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit {
  toast: Toast | null = null;
  visible = false;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe((t) => {
      this.toast = t;
      this.visible = true;

      setTimeout(() => (this.visible = false), 3000);
    });
  }
}
