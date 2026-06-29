import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { SocketService } from 'src/app/core/services/socket.service';
import {
  CustomerSupportService,
  SupportTicketPayload,
} from '../../services/customer-support.service';

type SupportTab = 'all' | 'active' | 'resolved';

@Component({
  selector: 'app-support-center',
  templateUrl: './support-center.component.html',
  styleUrls: ['./support-center.component.scss'],
})
export class SupportCenterComponent implements OnInit, OnDestroy {
  tickets: any[] = [];
  selectedTicket: any = null;
  replyText = '';
  searchTerm = '';
  activeTab: SupportTab = 'active';
  isLoading = false;
  isDetailLoading = false;
  isCreating = false;
  isSubmittingReply = false;
  errorMessage = '';
  successMessage = '';
  page = 1;
  limit = 20;
  total = 0;

  form: SupportTicketPayload = {
    subject: '',
    message: '',
    category: 'ORDER_ISSUE',
    priority: 'medium',
    order: null,
  };

  categories = [
    { value: 'ORDER_ISSUE', label: 'Order issue' },
    { value: 'PAYMENT', label: 'Payment' },
    { value: 'REFUND', label: 'Refund' },
    { value: 'ACCOUNT', label: 'Account' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'OTHER', label: 'Other' },
  ];

  priorities = [
    { value: 'medium', label: 'Normal' },
    { value: 'high', label: 'Urgent' },
    { value: 'low', label: 'Low' },
  ];

  private search$ = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    private supportService: CustomerSupportService,
    private authService: AuthService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (user?._id) {
      this.socketService.connect(user._id);
      this.socketService.onTicketReply((ticket) => this.applyRealtimeTicket(ticket));
      this.socketService.onTicketUpdated((ticket) => this.applyRealtimeTicket(ticket));
    }

    this.searchSub = this.search$.pipe(debounceTime(300)).subscribe((value) => {
      this.searchTerm = value.trim();
      this.page = 1;
      this.loadTickets();
    });

    this.loadTickets();
  }

  loadTickets(silent = false): void {
    if (!silent) this.isLoading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.page,
      limit: this.limit,
    };

    if (this.activeTab === 'active') {
      params.status = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED'];
    }

    if (this.activeTab === 'resolved') {
      params.status = ['RESOLVED', 'CLOSED'];
    }

    if (this.searchTerm.length >= 2) {
      params.search = this.searchTerm;
      delete params.status;
    }

    this.supportService.getTickets(params).subscribe({
      next: (res: any) => {
        this.tickets = res.data || [];
        this.total = res.pagination?.total || this.tickets.length;
        this.isLoading = false;

        if (!this.selectedTicket && this.tickets.length) {
          this.selectTicket(this.tickets[0]);
        }

        if (
          this.selectedTicket &&
          !this.tickets.some((ticket) => ticket._id === this.selectedTicket._id)
        ) {
          this.selectedTicket = this.tickets.length ? this.tickets[0] : null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message || 'Unable to load support tickets.';
      },
    });
  }

  changeTab(tab: SupportTab): void {
    if (this.activeTab === tab) return;

    this.activeTab = tab;
    this.page = 1;
    this.selectedTicket = null;
    this.loadTickets();
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }

  selectTicket(ticket: any): void {
    if (!ticket?._id) return;

    this.isDetailLoading = true;
    this.supportService.getTicketById(ticket._id).subscribe({
      next: (res: any) => {
        this.selectedTicket = res.data;
        this.markSelectedAsRead();
        this.isDetailLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        this.isDetailLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to open ticket.';
      },
    });
  }

  createTicket(): void {
    this.clearMessages();

    if (!this.form.subject.trim() || !this.form.message.trim()) {
      this.errorMessage = 'Please add a subject and message.';
      return;
    }

    this.isCreating = true;

    this.supportService
      .createTicket({
        ...this.form,
        subject: this.form.subject.trim(),
        message: this.form.message.trim(),
        order: this.form.order?.trim() || null,
      })
      .subscribe({
        next: (res: any) => {
          const ticket = res.data;
          this.tickets = [ticket, ...this.tickets];
          this.selectedTicket = ticket;
          this.form = {
            subject: '',
            message: '',
            category: 'ORDER_ISSUE',
            priority: 'medium',
            order: null,
          };
          this.isCreating = false;
          this.successMessage = 'Your support ticket has been raised.';
          this.selectTicket(ticket);
        },
        error: (err) => {
          this.isCreating = false;
          this.errorMessage =
            err?.error?.message || 'Unable to create support ticket.';
        },
      });
  }

  sendReply(): void {
    if (!this.replyText.trim() || !this.selectedTicket?._id) return;

    this.clearMessages();
    this.isSubmittingReply = true;

    this.supportService
      .replyToTicket(this.selectedTicket._id, this.replyText.trim())
      .subscribe({
        next: (res: any) => {
          this.selectedTicket.messages = [
            ...(this.selectedTicket.messages || []),
            res.data,
          ];
          this.selectedTicket.status =
            this.selectedTicket.status === 'RESOLVED' ||
            this.selectedTicket.status === 'CLOSED'
              ? 'REOPENED'
              : this.selectedTicket.status;
          this.replyText = '';
          this.isSubmittingReply = false;
          this.loadTickets(true);
          this.scrollToBottom();
        },
        error: (err) => {
          this.isSubmittingReply = false;
          this.errorMessage = err?.error?.message || 'Unable to send reply.';
        },
      });
  }

  isTicketClosed(ticket: any): boolean {
    return ['RESOLVED', 'CLOSED'].includes(ticket?.status);
  }

  statusLabel(status: string): string {
    return (status || '').replace(/_/g, ' ').toLowerCase();
  }

  private applyRealtimeTicket(ticket: any): void {
    if (!ticket?._id) return;

    const index = this.tickets.findIndex((item) => item._id === ticket._id);
    if (index >= 0) {
      this.tickets[index] = { ...this.tickets[index], ...ticket };
      this.tickets = [...this.tickets];
    } else if (this.activeTab !== 'resolved') {
      this.tickets = [ticket, ...this.tickets];
    }

    if (this.selectedTicket?._id === ticket._id) {
      this.selectedTicket = ticket;
      this.markSelectedAsRead();
      this.scrollToBottom();
    }
  }

  private markSelectedAsRead(): void {
    if (!this.selectedTicket?._id || !this.selectedTicket.unreadForUser) {
      return;
    }

    this.supportService.markAsRead(this.selectedTicket._id).subscribe({
      next: () => {
        this.selectedTicket.unreadForUser = 0;
        this.tickets = this.tickets.map((ticket) =>
          ticket._id === this.selectedTicket._id
            ? { ...ticket, unreadForUser: 0 }
            : ticket,
        );
      },
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.support-thread');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }
}
