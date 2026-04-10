import { Component, OnInit } from '@angular/core';
import { AdminSupportService } from '../../services/admin-support.service';
import { Subject, debounceTime, interval, Subscription } from 'rxjs';
@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
  // 🔹 STATE
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
  refreshSub!: Subscription;
  constructor(private adminSupportService: AdminSupportService) {}

  ngOnInit(): void {
    this.fetchTickets();
    this.fetchCounts();

    this.refreshSub = interval(5000).subscribe(() => {
      this.fetchTickets(true);
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
        // ✅ PRESERVE SELECTION (NO FLICKER)

        if (this.tickets.length) {
          if (!this.selectedTicket) {
            // first time only
            this.selectTicket(this.tickets[0]);
          } else {
            // keep same ticket selected if exists
            const updated = this.tickets.find(
              (t) => t._id === this.selectedTicket._id,
            );

            if (!this.selectedTicket) {
              // first load only
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

    const messageText = this.replyText;

    this.adminSupportService
      .replyToTicket(this.selectedTicket._id, messageText)
      .subscribe({
        next: (res: any) => {
          //  push message directly (NO REFETCH)
          if (!this.selectedTicket.messages) {
            this.selectedTicket.messages = [];
          }

          this.selectedTicket.messages.push(res.data);

          this.replyText = '';

          this.scrollToBottom(); // smooth UX
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

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }
}
