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
  private newTicketSubject = new Subject<any>();
  newTicket$ = this.newTicketSubject.asObservable();

  private orderUpdateSubject = new Subject<any>();
  orderUpdate$ = this.orderUpdateSubject.asObservable();

  private userUpdateSubject = new Subject<void>();
  userUpdate$ = this.userUpdateSubject.asObservable();

  constructor(
    private notificationStore: AdminNotificationStore,
    private toastService: ToastService,
  ) {
    this.socket = io(environment.apiBaseUrl.replace('/api', ''), {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log(' Socket connected:', this.socket.id);
      this.socket.emit('join-admin');
    });

    //  SINGLE GLOBAL LISTENER
    this.socket.on('admin-order-update', (data: any) => {
      console.log(' GLOBAL SOCKET EVENT:', data);
      this.orderUpdateSubject.next(data);
    });

    this.socket.on('admin-user-update', () => {
      console.log(' USER EVENT RECEIVED');
      this.userUpdateSubject.next();
    });

    this.socket.on('admin_notification', (data: any) => {
      console.log(' SOCKET NOTIFICATION:', data);

      this.notificationStore.addNotification(data);
      this.toastService.showNotification(data);
    });

    this.socket.on('new_ticket', (data: any) => {
      // emit for components (support page)
      this.newTicketSubject.next(data);

      this.notificationStore.addNotification({
        _id: data._id || new Date().getTime().toString(),
        title: 'New Support Ticket',
        message: data.subject,
        type: 'ticket',
        priority: 'HIGH',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // show toast globally (dashboard, etc.)
      this.toastService.showNotification({
        title: 'New Support Ticket',
        message: data.subject,
        priority: 'HIGH',
      });
    });
  }

  private notificationSubject = new Subject<any>();
  notification$ = this.notificationSubject.asObservable();
}
