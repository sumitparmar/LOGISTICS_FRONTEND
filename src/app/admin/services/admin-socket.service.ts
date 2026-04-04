import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AdminNotificationStore } from './admin-notification.store';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class AdminSocketService {
  private socket: Socket;

  private orderUpdateSubject = new Subject<any>();
  orderUpdate$ = this.orderUpdateSubject.asObservable();

  constructor(
    private notificationStore: AdminNotificationStore,
    private toastService: ToastService,
  ) {
    this.socket = io(environment.apiBaseUrl.replace('/api', ''), {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.socket.emit('join-admin');
    });

    //  SINGLE GLOBAL LISTENER
    this.socket.on('admin-order-update', (data: any) => {
      console.log(' GLOBAL SOCKET EVENT:', data);
      this.orderUpdateSubject.next(data);
    });

    this.socket.on('admin_notification', (data: any) => {
      console.log(' SOCKET NOTIFICATION:', data);

      this.notificationStore.addNotification(data);
      this.toastService.showNotification(data);
    });
  }

  private notificationSubject = new Subject<any>();
  notification$ = this.notificationSubject.asObservable();
}
