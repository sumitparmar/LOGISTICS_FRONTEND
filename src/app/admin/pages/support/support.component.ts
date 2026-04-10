import { Component, OnInit } from '@angular/core';
import { AdminSupportService } from '../../services/admin-support.service';
import { Subject, debounceTime } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
  socket: any;
  tickets: any[] = [];
  selectedTicket: any = null;
  replyText: string = '';
  searchTerm = '';
  searchSubject = new Subject<string>();
  currentTab: 'open' | 'in-progress' | 'resolved' = 'open';
  page = 1;
  limit = 10;
  total = 0;
  isLoading = false;
  isDetailLoading = false;
  counts: any = {};
  constructor(private adminSupportService: AdminSupportService) {}

  ngOnInit(): void {
    this.fetchTickets();
    this.fetchCounts();
    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log(' Connected:', this.socket.id);
      this.socket.emit('join-admin');
    });

    //  MUST ADD THIS
    this.socket.io.on('reconnect', () => {
      console.log('🔁 Reconnected');
      this.socket.emit('join-admin');
    });

    this.socket.off('new_ticket');
    this.socket.off('ticket_updated');

    this.socket.on('new_ticket', (ticket: any) => {
      const exists = this.tickets.find((t) => t._id === ticket._id);

      if (!exists) {
        this.tickets = [ticket, ...this.tickets];
      }

      // IMPORTANT — auto select + load messages
      this.selectTicket(ticket);

      this.fetchCounts();
    });

    this.socket.on('ticket_updated', (updatedTicket: any) => {
      console.log('♻️ update aaya');

      const index = this.tickets.findIndex((t) => t._id === updatedTicket._id);

      if (index !== -1) {
        this.tickets[index] = updatedTicket;
      }

      if (this.selectedTicket?._id === updatedTicket._id) {
        this.selectedTicket = updatedTicket;
        this.scrollToBottom();
      }
    });

    this.searchSubject.pipe(debounceTime(400)).subscribe((value) => {
      this.searchTerm = value;
      this.page = 1;
      this.fetchTickets();
    });
  }

  // 🔹 FETCH ALL TICKETS
  fetchTickets(isSilent = false): void {
    if (!isSilent) {
      this.isLoading = true;
    }
    const params: any = {
      page: this.page,
      limit: this.limit,
      status: this.currentTab,
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.adminSupportService.getTickets(params).subscribe({
      next: (res: any) => {
        this.tickets = res.data || [];
        this.total = res.pagination?.total || 0;
        if (!isSilent) {
          this.isLoading = false;
        }

        if (this.tickets.length) {
          if (!this.selectedTicket) {
            this.selectTicket(this.tickets[0]);
          } else {
            const exists = this.tickets.find(
              (t) => t._id === this.selectedTicket._id,
            );

            if (!exists) {
              this.selectTicket(this.tickets[0]);
            }
          }
        }
      },

      error: (err) => {
        console.error('Fetch tickets error:', err);
        this.isLoading = false;
      },
    });
  }

  changeTab(tab: 'open' | 'in-progress' | 'resolved') {
    if (this.currentTab === tab) return;

    this.currentTab = tab;

    this.page = 1;
    this.selectedTicket = null;

    this.fetchTickets();
    this.fetchCounts();
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  //  SELECT TICKET
  selectTicket(ticket: any): void {
    if (
      this.selectedTicket?._id === ticket._id &&
      this.selectedTicket?.messages?.length
    ) {
      return;
    }
    if (!ticket?._id) return;

    this.isDetailLoading = true;

    this.adminSupportService.getTicketById(ticket._id).subscribe({
      next: (res: any) => {
        this.selectedTicket = res.data;
        this.scrollToBottom();
        this.isDetailLoading = false;
      },
      error: (err) => {
        console.error('Fetch ticket detail error:', err);
        this.isDetailLoading = false;
      },
    });
  }

  // 🔹 SEND REPLY

  sendReply(): void {
    if (!this.replyText.trim() || !this.selectedTicket?._id) return;

    this.adminSupportService
      .replyToTicket(this.selectedTicket._id, this.replyText)
      .subscribe({
        next: (res: any) => {
          if (!this.selectedTicket.messages) {
            this.selectedTicket.messages = [];
          }

          this.selectedTicket.messages.push(res.data);

          this.replyText = '';
          this.scrollToBottom();
        },
        error: (err) => {
          console.error('Reply error:', err);
        },
      });
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.chat-box');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  // 🔹 UPDATE STATUS

  updateStatus(status: string): void {
    if (!this.selectedTicket?._id) return;

    this.adminSupportService
      .updateStatus(this.selectedTicket._id, status)
      .subscribe({
        next: (res: any) => {
          const updatedStatus = res.data.status;

          //  tab sync
          this.currentTab = updatedStatus;

          //  reset state
          this.selectedTicket = null;
          this.page = 1;

          //  fetch fresh data
          this.fetchTickets();
          this.fetchCounts();
        },
        error: (err) => {
          console.error('Status update error:', err);
        },
      });
  }

  reopenTicket(): void {
    if (!this.selectedTicket?._id) return;

    this.adminSupportService
      .updateStatus(this.selectedTicket._id, 'in-progress')
      .subscribe({
        next: () => {
          // switch tab
          this.currentTab = 'in-progress';

          //  reset state
          this.selectedTicket = null;
          this.page = 1;

          //  fetch updated list
          this.fetchTickets();
          this.fetchCounts();
        },
        error: (err) => {
          console.error('Reopen error:', err);
        },
      });
  }

  fetchCounts() {
    this.adminSupportService.getCounts().subscribe({
      next: (res: any) => {
        this.counts = res.data;
      },
      error: (err) => {
        console.error('Count fetch error:', err);
      },
    });
  }
}
