import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class AdminSocketService {
  private socket!: Socket;

  connect(): void {
    if (this.socket) return;

    this.socket = io('http://localhost:5000', { transports: ['websocket'] });

    this.socket.emit('join-admin');
  }

  onOrderUpdate(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on('admin-order-update', callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
