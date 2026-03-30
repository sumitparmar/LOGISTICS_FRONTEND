import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  private socket: any;

  ngOnInit() {
    this.socket = io('http://localhost:5000');
    this.socket.emit('join-admin');
    this.socket.on('order-updated', () => {
      console.log('Order updated → refresh drivers');

      window.location.reload();
    });
  }
}
