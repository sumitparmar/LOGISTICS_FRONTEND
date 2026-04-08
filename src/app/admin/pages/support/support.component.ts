import { Component, OnInit } from '@angular/core';
import { AdminSupportService } from '../../services/admin-support.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
  tickets: any[] = [];
  selectedTicket: any = null;
  replyText: string = '';
  loading: boolean = false;

  constructor(private adminSupportService: AdminSupportService) {}

  ngOnInit(): void {
    this.fetchTickets();
  }

  // 🔹 FETCH ALL TICKETS
  fetchTickets(): void {
    this.loading = true;

    this.adminSupportService.getTickets().subscribe({
      next: (res: any) => {
        this.tickets = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Fetch tickets error:', err);
        this.loading = false;
      },
    });
  }

  // 🔹 SELECT TICKET (LOAD DETAILS + MESSAGES)
  selectTicket(ticket: any): void {
    if (!ticket?._id) return;

    this.adminSupportService.getTicketById(ticket._id).subscribe({
      next: (res: any) => {
        this.selectedTicket = res.data;
      },
      error: (err) => {
        console.error('Fetch ticket detail error:', err);
      },
    });
  }

  // 🔹 SEND REPLY
  sendReply(): void {
    if (!this.replyText.trim() || !this.selectedTicket?._id) return;

    this.adminSupportService
      .replyToTicket(this.selectedTicket._id, this.replyText)
      .subscribe({
        next: () => {
          this.replyText = '';
          this.selectTicket(this.selectedTicket); // refresh messages
        },
        error: (err) => {
          console.error('Reply error:', err);
        },
      });
  }

  // 🔹 UPDATE STATUS
  updateStatus(status: string): void {
    if (!this.selectedTicket?._id) return;

    this.adminSupportService
      .updateStatus(this.selectedTicket._id, status)
      .subscribe({
        next: (res: any) => {
          this.selectedTicket.status = res.data.status;
        },
        error: (err) => {
          console.error('Status update error:', err);
        },
      });
  }
}
