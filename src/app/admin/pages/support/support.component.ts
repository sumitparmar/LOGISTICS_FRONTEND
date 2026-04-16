import { Component, OnInit } from '@angular/core';
import { AdminSupportService } from '../../services/admin-support.service';
import { Subject, debounceTime } from 'rxjs';
import { Subscription } from 'rxjs';
import { AdminNotificationService } from '../../services/admin-notification.service';
import { ToastService } from 'src/app/admin/services/toast.service';
import { AdminSocketService } from '../../services/admin-socket.service';
import { ActivatedRoute } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
  private ticketSub!: Subscription;
  private searchSub!: Subscription;
  private routeSub!: Subscription;
  private ticketsStreamSub!: Subscription;
  socket: any;
  tickets: any[] = [];
  selectedTicket: any = null;
  replyText: string = '';
  searchTerm: string = '';
  // searchSubject = new Subject<string>();
  private searchTerm$ = new Subject<string>();
  // private page$ = new Subject<number>();
  currentTab: 'open' | 'in-progress' | 'resolved' = 'open';
  page = 1;
  limit = 10;
  total = 0;
  isLoading = false;
  isDetailLoading = false;
  counts: any = {};
  isSearching = false;
  constructor(
    private adminSupportService: AdminSupportService,
    private notificationService: AdminNotificationService,
    private toastService: ToastService,
    private socketService: AdminSocketService,
    private route: ActivatedRoute,
    public permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    // this.searchTerm$.next('');
    this.fetchCounts();
    this.notificationService.fetchUnreadCount();

    this.ticketSub = this.socketService.newTicket$.subscribe((ticket: any) => {
      const exists = this.tickets.find((t) => t._id === ticket._id);

      if (!exists && ticket.status === this.currentTab && !this.isSearching) {
        this.tickets = [ticket, ...this.tickets];
      }

      this.selectTicket(ticket);
      this.fetchCounts();
    });

    this.searchSub = this.searchTerm$
      .pipe(
        debounceTime(400),
        switchMap((value) => {
          this.isLoading = true;

          this.searchTerm = value?.trim();
          this.isSearching = this.searchTerm.length >= 2;

          const params: any = {
            page: this.page,
            limit: this.limit,
          };

          if (!this.isSearching) {
            params.status = this.currentTab;
          }

          if (this.isSearching) {
            params.search = this.searchTerm;
          }

          return this.adminSupportService.fetchTicketsReactive(params).pipe(
            catchError((err) => {
              console.error('Search API error:', err);
              return of({ data: [], pagination: { total: 0 } });
            }),
          );
        }),
      )

      .subscribe((res: any) => {
        this.isLoading = false;

        this.tickets = res.data || [];
        this.total = res.pagination?.total || 0;
        this.adminSupportService['ticketsSubject'].next(res);

        if (!this.tickets.length) {
          this.selectedTicket = null;
          return;
        }

        if (!this.selectedTicket) {
          this.selectTicket(this.tickets[0]);
          return;
        }

        const exists = this.tickets.find(
          (t) => t._id === this.selectedTicket._id,
        );

        if (!exists) {
          this.selectTicket(this.tickets[0]);
        }
      });

    this.routeSub = this.route.queryParams.subscribe((params) => {
      if (params['ticketId']) {
        const ticketId = params['ticketId'];

        // fetch & open that ticket
        this.adminSupportService.getTicketById(ticketId).subscribe({
          next: (res: any) => {
            this.selectedTicket = res.data;
            this.scrollToBottom();
          },
          error: (err) => {
            console.error('Notification open error:', err);
          },
        });
      }
    });
    this.searchTerm$.next('');
    this.ticketsStreamSub = this.adminSupportService.tickets$.subscribe(
      (res: any) => {
        if (!res) return;

        this.tickets = res.data || [];
        this.total = res.pagination?.total || 0;

        if (!this.tickets.length) {
          this.selectedTicket = null;
          return;
        }

        if (!this.selectedTicket) {
          this.selectTicket(this.tickets[0]);
          return;
        }

        const exists = this.tickets.find(
          (t) => t._id === this.selectedTicket._id,
        );

        if (!exists) {
          this.selectTicket(this.tickets[0]);
        }
      },
    );
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.searchTerm$.next(this.searchTerm || '');
  }

  fetchTickets(isSilent = false): void {
    if (this.isSearching) return;

    if (!isSilent) {
      this.isLoading = true;
    }

    const params: any = {
      page: this.page,
      limit: this.limit,
    };

    if (this.searchTerm && this.searchTerm.length >= 2) {
      params.search = this.searchTerm;
    } else {
      params.status = this.currentTab;
    }

    this.adminSupportService.fetchTicketsReactive(params).subscribe({
      next: (res: any) => {
        this.tickets = res.data || [];
        this.total = res.pagination?.total || 0;

        if (!isSilent) {
          this.isLoading = false;
        }

        // 🔥 FIX START (IMPORTANT)

        // 1. if no tickets → clear selection
        if (!this.tickets.length) {
          this.selectedTicket = null;
          return;
        }

        // 2. if no selected → select first
        if (!this.selectedTicket) {
          this.selectTicket(this.tickets[0]);
          return;
        }

        // 3. if selected not in new list → select first
        const exists = this.tickets.find(
          (t) => t._id === this.selectedTicket._id,
        );

        if (!exists) {
          this.selectTicket(this.tickets[0]);
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
    this.searchTerm$.next(this.searchTerm || '');
    this.fetchCounts();
  }

  onSearch(value: string) {
    this.searchTerm$.next(value);
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

  //  SEND REPLY
  sendReply(): void {
    if (!this.permissionService.has('support.reply')) return;
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

  //  UPDATE STATUS
  updateStatus(status: string): void {
    if (!this.permissionService.has('support.update')) return;
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
    if (!this.permissionService.has('support.update')) return;
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
    this.ticketSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.ticketsStreamSub?.unsubscribe();
  }
}
