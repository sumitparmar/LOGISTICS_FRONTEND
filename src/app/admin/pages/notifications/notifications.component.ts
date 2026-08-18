import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  finalize,
} from 'rxjs';
import { AdminNotificationService } from '../../services/admin-notification.service';
import {
  AdminNotification,
  AdminNotificationStore,
} from '../../services/admin-notification.store';
import { PermissionService } from '../../services/permission.service';
import { ToastService } from '../../services/toast.service';

type ReadFilter = 'ALL' | 'UNREAD' | 'READ';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: AdminNotification[] = [];
  unreadCount = 0;
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 1;

  searchTerm = '';
  readFilter: ReadFilter = 'ALL';
  typeFilter = '';
  priorityFilter = '';

  isLoading = false;
  bulkAction = false;
  actionId: string | null = null;
  errorMessage = '';
  showDeleteConfirm = false;
  pendingDelete: AdminNotification | null = null;

  readonly types = ['ORDER', 'DRIVER', 'PAYMENT', 'SYSTEM', 'USER'];
  readonly priorities = ['HIGH', 'MEDIUM', 'LOW'];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private unreadSubscription?: Subscription;

  constructor(
    private notificationService: AdminNotificationService,
    private notificationStore: AdminNotificationStore,
    private router: Router,
    public permissionService: PermissionService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1;
        this.loadNotifications();
      });

    this.unreadSubscription = this.notificationStore.unreadCount$.subscribe(
      (count) => (this.unreadCount = count),
    );

    this.notificationService.fetchUnreadCount();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.unreadSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: Record<string, string | number> = {
      page: this.page,
      limit: this.limit,
    };

    if (this.searchTerm.trim().length >= 2) {
      params['search'] = this.searchTerm.trim();
    }

    if (this.readFilter !== 'ALL') {
      params['isRead'] = this.readFilter === 'READ' ? 'true' : 'false';
    }

    if (this.typeFilter) params['type'] = this.typeFilter;
    if (this.priorityFilter) params['priority'] = this.priorityFilter;

    this.notificationService
      .fetchNotifications(params)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res: any) => {
          const result = res?.data || {};
          this.notifications = result.data || [];
          const pagination = result.pagination || {};
          this.total = Number(pagination.total || 0);
          this.totalPages = Math.max(
            Number(pagination.totalPages || pagination.pages || 1),
            1,
          );

          if (this.page > this.totalPages) {
            this.page = this.totalPages;
            this.loadNotifications();
            return;
          }

        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message || 'Unable to load notifications';
        },
      });
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  setReadFilter(value: ReadFilter): void {
    if (this.readFilter === value) return;
    this.readFilter = value;
    this.page = 1;
    this.loadNotifications();
  }

  setTypeFilter(value: string): void {
    if (this.typeFilter === value) return;
    this.typeFilter = value;
    this.page = 1;
    this.loadNotifications();
  }

  setPriorityFilter(value: string): void {
    if (this.priorityFilter === value) return;
    this.priorityFilter = value;
    this.page = 1;
    this.loadNotifications();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.readFilter = 'ALL';
    this.typeFilter = '';
    this.priorityFilter = '';
    this.page = 1;
    this.loadNotifications();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.loadNotifications();
  }

  onLimitChange(limit: number): void {
    if (limit === this.limit) return;
    this.limit = limit;
    this.page = 1;
    this.loadNotifications();
  }

  markAsRead(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();
    if (
      notification.isRead ||
      this.actionId ||
      !this.permissionService.has('notifications.update')
    ) {
      return;
    }

    this.actionId = notification._id;
    this.notificationService
      .markAsRead(notification._id)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
        next: () => {
          this.notificationStore.markAsRead(notification._id);
          notification.isRead = true;
          this.notificationService.fetchUnreadCount();
          if (this.readFilter === 'UNREAD') {
            this.loadNotifications();
          }
        },
        error: (error) => {
          this.toastService.error(
            error?.error?.message || 'Unable to mark notification as read',
          );
        },
      });
  }

  markAllAsRead(): void {
    if (
      !this.unreadCount ||
      this.bulkAction ||
      !this.permissionService.has('notifications.update')
    ) {
      return;
    }

    this.bulkAction = true;
    this.notificationService
      .markAllAsRead()
      .pipe(finalize(() => (this.bulkAction = false)))
      .subscribe({
        next: () => {
          this.notificationStore.markAllAsRead();
          this.notificationService.fetchUnreadCount();
          this.toastService.success('All notifications marked as read');
          if (this.readFilter === 'UNREAD') {
            this.loadNotifications();
          } else {
            this.notifications = this.notifications.map((item) => ({
              ...item,
              isRead: true,
            }));
          }
        },
        error: (error) => {
          this.toastService.error(
            error?.error?.message || 'Unable to update notifications',
          );
        },
      });
  }

  requestDelete(notification: AdminNotification, event: Event): void {
    event.stopPropagation();
    if (
      this.actionId ||
      !this.permissionService.has('notifications.update')
    ) {
      return;
    }

    this.pendingDelete = notification;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    if (this.actionId) return;
    this.pendingDelete = null;
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    const notification = this.pendingDelete;
    if (
      !notification ||
      this.actionId ||
      !this.permissionService.has('notifications.update')
    ) {
      return;
    }

    this.actionId = notification._id;
    this.notificationService
      .deleteNotification(notification._id)
      .pipe(
        finalize(() => {
          this.actionId = null;
          this.pendingDelete = null;
          this.showDeleteConfirm = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationStore.removeNotification(notification._id);
          this.total = Math.max(this.total - 1, 0);
          this.notificationService.fetchUnreadCount();
          this.toastService.success('Notification deleted');
          this.loadNotifications();
        },
        error: (error) => {
          this.toastService.error(
            error?.error?.message || 'Unable to delete notification',
          );
        },
      });
  }

  onNotificationClick(notification: AdminNotification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    if (
      notification.ticketId &&
      this.permissionService.has('support.read')
    ) {
      this.router.navigate(['/admin/support'], {
        queryParams: { ticketId: notification.ticketId },
      });
      return;
    }

    if (
      notification.actionUrl &&
      notification.actionUrl.startsWith('/admin/')
    ) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  typeLabel(type: string): string {
    return String(type || 'SYSTEM').replace(/_/g, ' ');
  }

  priorityLabel(priority: string): string {
    return String(priority || 'MEDIUM');
  }

  trackByNotification(_: number, notification: AdminNotification): string {
    return notification._id;
  }
}
