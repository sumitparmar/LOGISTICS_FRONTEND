import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private counter = 0;

  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private get currentToasts(): Toast[] {
    return this.toastsSubject.value;
  }

  show(message: string, type: ToastType = 'success') {
    const toast: Toast = {
      id: ++this.counter,
      message,
      type,
    };

    this.toastsSubject.next([...this.currentToasts, toast]);

    setTimeout(() => this.remove(toast.id), 3000);
  }

  remove(id: number) {
    const updated = this.currentToasts.filter((t) => t.id !== id);
    this.toastsSubject.next(updated);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }
}
