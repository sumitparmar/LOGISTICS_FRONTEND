import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminSocketService {
  private socket: Socket;

  private orderUpdateSubject = new Subject<any>();
  orderUpdate$ = this.orderUpdateSubject.asObservable();

  constructor() {
    this.socket = io(environment.apiBaseUrl.replace('/api', ''), {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.socket.emit('join-admin');
    });

    // 🔥 SINGLE GLOBAL LISTENER
    this.socket.on('admin-order-update', (data: any) => {
      console.log('🔥 GLOBAL SOCKET EVENT:', data);
      this.orderUpdateSubject.next(data);
    });
  }
}
