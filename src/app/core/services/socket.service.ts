import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;

  connect(userId: string): void {
    if (this.socket?.connected && this.connectedUserId === userId) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectedUserId = userId;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join-user-room', userId);
    });
  }

  onOrderStatusUpdate(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.off('order-status-update');
    this.socket.on('order-status-update', callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectedUserId = null;
  }
}
