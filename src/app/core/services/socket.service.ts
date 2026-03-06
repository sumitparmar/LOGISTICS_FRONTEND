import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;

  connect(userId: string) {
    // prevent duplicate connections
    if (this.socket) return;

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    this.socket.emit('join-user-room', userId);
  }

  onOrderStatusUpdate(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('order-status-update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
